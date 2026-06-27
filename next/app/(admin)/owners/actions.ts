"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createManagedUser, deleteManagedUser } from "@/lib/users-admin";

export interface OwnerFormState {
  error?: string;
  success?: boolean;
}

// フォームから物件紐付けを抽出
// 各行は property_id_<rowKey> / role_<rowKey> / notify_<rowKey> で送られる。
// 同一物件が重複した場合は後勝ちで1件にまとめる（property_members の複合PK衝突を防ぐ）。
function parseMemberships(formData: FormData) {
  const map = new Map<string, { propertyId: string; role: string; notify: boolean }>();
  for (const key of formData.keys()) {
    if (!key.startsWith("property_id_")) continue;
    const rowKey = key.slice("property_id_".length);
    const propertyId = String(formData.get(key) ?? "").trim();
    if (!propertyId) continue;
    const role = String(formData.get(`role_${rowKey}`) ?? "owner");
    const notify = formData.get(`notify_${rowKey}`) != null;
    map.set(propertyId, { propertyId, role, notify });
  }
  return [...map.values()];
}

export async function createOwner(
  _prev: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  const user = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const billing = String(formData.get("billing_address") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };

  const result = await createManagedUser({
    contractorId: user.contractorId,
    role: "contact",
    name,
  });
  if (result.error || !result.userId) {
    return { error: result.error ?? "作成に失敗しました。" };
  }

  const supabase = await createClient();
  await supabase.from("property_member_profiles").insert({
    user_id: result.userId,
    company_name: companyName,
    phone,
    billing_address: billing,
  });

  const memberships = parseMemberships(formData);
  if (memberships.length > 0) {
    await supabase.from("property_members").insert(
      memberships.map((m) => ({
        user_id: result.userId!,
        property_id: m.propertyId,
        role: m.role,
        notify: m.notify,
      }))
    );
  }

  revalidatePath("/owners");
  redirect(`/owners/${result.userId}/edit?created=1`);
}

export async function updateOwner(
  userId: string,
  _prev: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const billing = String(formData.get("billing_address") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", userId);
  if (error) return { error: "更新に失敗しました。" };

  await supabase.from("property_member_profiles").upsert({
    user_id: userId,
    company_name: companyName,
    phone,
    billing_address: billing,
  });

  // 物件紐付けは一旦削除して入れ直す
  await supabase.from("property_members").delete().eq("user_id", userId);
  const memberships = parseMemberships(formData);
  if (memberships.length > 0) {
    await supabase.from("property_members").insert(
      memberships.map((m) => ({
        user_id: userId,
        property_id: m.propertyId,
        role: m.role,
        notify: m.notify,
      }))
    );
  }

  revalidatePath("/owners");
  return { success: true };
}

export async function deleteOwner(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("id") ?? "");
  if (!userId) return;
  await deleteManagedUser(userId);
  revalidatePath("/owners");
}
