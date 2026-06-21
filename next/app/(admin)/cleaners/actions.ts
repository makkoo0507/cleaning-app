"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createManagedUser,
  deleteManagedUser,
  countCleaners,
} from "@/lib/users-admin";
import type { ContractorCompany } from "@/lib/database.types";

export interface CleanerFormState {
  error?: string;
}

export async function createCleaner(
  _prev: CleanerFormState,
  formData: FormData
): Promise<CleanerFormState> {
  const user = await requireContractor();
  const name = String(formData.get("name") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };

  // プラン上限チェック（清掃者数）
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("contractor_companies")
    .select("max_cleaners")
    .eq("id", user.companyId)
    .single<Pick<ContractorCompany, "max_cleaners">>();

  if (company?.max_cleaners != null) {
    const current = await countCleaners(user.companyId);
    if (current >= company.max_cleaners) {
      return {
        error: `清掃者数が上限（${company.max_cleaners}名）に達しています。有料プランへのアップグレードが必要です。`,
      };
    }
  }

  const result = await createManagedUser({
    companyId: user.companyId,
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
  redirect("/cleaners");
}

export async function updateCleaner(
  userId: string,
  _prev: CleanerFormState,
  formData: FormData
): Promise<CleanerFormState> {
  await requireContractor();
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
  redirect("/cleaners");
}

export async function deleteCleaner(formData: FormData) {
  await requireContractor();
  const userId = String(formData.get("id") ?? "");
  if (!userId) return;
  await deleteManagedUser(userId);
  revalidatePath("/cleaners");
}
