"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createManagedUser, deleteManagedUser } from "@/lib/users-admin";

export interface OwnerFormState {
  error?: string;
}

// フォームから物件紐付けを抽出: property_<id>=on, role_<id>=owner, notify_<id>=on
function parseMemberships(formData: FormData) {
  const memberships: {
    propertyId: string;
    role: string;
    notify: boolean;
  }[] = [];
  for (const key of formData.keys()) {
    if (key.startsWith("property_")) {
      const propertyId = key.slice("property_".length);
      const role = String(formData.get(`role_${propertyId}`) ?? "owner");
      const notify = formData.get(`notify_${propertyId}`) != null;
      memberships.push({ propertyId, role, notify });
    }
  }
  return memberships;
}

export async function createOwner(
  _prev: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  const user = await requireContractor();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const billing = String(formData.get("billing_address") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };

  const result = await createManagedUser({
    companyId: user.companyId,
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
  redirect("/owners");
}

export async function updateOwner(
  userId: string,
  _prev: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  await requireContractor();
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
  redirect("/owners");
}

export async function deleteOwner(formData: FormData) {
  await requireContractor();
  const userId = String(formData.get("id") ?? "");
  if (!userId) return;
  await deleteManagedUser(userId);
  revalidatePath("/owners");
}
