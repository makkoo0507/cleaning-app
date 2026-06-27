"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createManagedUser,
  deleteManagedUser,
  countCleaners,
} from "@/lib/users-admin";
import type { Contractor } from "@/lib/database.types";

export interface CleanerFormState {
  error?: string;
  success?: boolean;
}

export async function createCleaner(
  _prev: CleanerFormState,
  formData: FormData
): Promise<CleanerFormState> {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };

  // プラン上限チェック（清掃者数）
  const supabase = await createClient();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("max_cleaners")
    .eq("id", user.contractorId)
    .single<Pick<Contractor, "max_cleaners">>();

  if (contractor?.max_cleaners != null) {
    const current = await countCleaners(user.contractorId);
    if (current >= contractor.max_cleaners) {
      return {
        error: `清掃者数が上限（${contractor.max_cleaners}名）に達しています。有料プランへのアップグレードが必要です。`,
      };
    }
  }

  const result = await createManagedUser({
    contractorId: user.contractorId,
    role: "cleaner",
    name,
  });
  if (result.error || !result.userId) {
    return { error: result.error ?? "作成に失敗しました。" };
  }

  await supabase
    .from("cleaner_profiles")
    .insert({ user_id: result.userId, skills, note });

  revalidatePath("/cleaners");
  redirect(`/cleaners/${result.userId}/edit?created=1`);
}

export async function updateCleaner(
  userId: string,
  _prev: CleanerFormState,
  formData: FormData
): Promise<CleanerFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", userId);
  if (error) return { error: "更新に失敗しました。" };

  await supabase
    .from("cleaner_profiles")
    .upsert({ user_id: userId, skills, note });

  revalidatePath("/cleaners");
  return { success: true };
}

export async function deleteCleaner(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("id") ?? "");
  if (!userId) return;
  await deleteManagedUser(userId);
  revalidatePath("/cleaners");
}
