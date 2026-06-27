"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Contractor } from "@/lib/database.types";

export interface PropertyFormState {
  error?: string;
  success?: boolean;
}

function parseForm(formData: FormData) {
  const billing = formData.get("default_billing_amount");
  const payment = formData.get("default_payment_amount");
  const startTime = String(formData.get("default_start_time") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim() || null,
    default_billing_amount: billing ? Number(billing) : null,
    default_payment_amount: payment ? Number(payment) : null,
    default_start_time: startTime || null,
  };
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireAdmin();
  const { name, address, notes, default_billing_amount, default_payment_amount, default_start_time } = parseForm(formData);

  if (!name || !address) return { error: "物件名と住所は必須です。" };

  const supabase = await createClient();

  // プラン上限チェック（テーブル設計.md）
  const [{ data: contractor }, { count }] = await Promise.all([
    supabase
      .from("contractors")
      .select("max_properties")
      .eq("id", user.contractorId)
      .single<Pick<Contractor, "max_properties">>(),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.contractorId),
  ]);

  if (contractor?.max_properties != null && (count ?? 0) >= contractor.max_properties) {
    return {
      error: `物件数が上限（${contractor.max_properties}件）に達しています。有料プランへのアップグレードが必要です。`,
    };
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({ contractor_id: user.contractorId, name, address, notes, default_billing_amount, default_payment_amount, default_start_time })
    .select("id")
    .single();

  if (error || !data) return { error: "登録に失敗しました。" };

  revalidatePath("/properties");
  redirect(`/properties/${data.id}/edit?created=1`);
}

export async function updateProperty(
  id: string,
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireAdmin();
  const { name, address, notes, default_billing_amount, default_payment_amount, default_start_time } = parseForm(formData);

  if (!name || !address) return { error: "物件名と住所は必須です。" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ name, address, notes, default_billing_amount, default_payment_amount, default_start_time })
    .eq("id", id);

  if (error) return { error: "更新に失敗しました。" };

  revalidatePath("/properties");
  return { success: true };
}

export async function deleteProperty(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/properties");
}
