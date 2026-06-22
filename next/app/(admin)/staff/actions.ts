"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createManagedUser, deleteManagedUser } from "@/lib/users-admin";

export interface StaffFormState {
  error?: string;
}

export async function createStaff(
  _prev: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const department = String(formData.get("department") ?? "").trim() || null;
  const employeeCode = String(formData.get("employee_code") ?? "").trim() || null;

  if (!name || !email || !password) {
    return { error: "名前・メール・パスワードは必須です。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }

  const result = await createManagedUser({
    companyId: admin.companyId,
    role: "contractor_staff",
    name,
    email,
    password,
  });
  if (result.error || !result.userId) {
    return { error: result.error ?? "作成に失敗しました。" };
  }

  const supabase = await createClient();
  await supabase.from("contractor_member_profiles").insert({
    user_id: result.userId,
    department,
    employee_code: employeeCode,
  });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaff(
  userId: string,
  _prev: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const department = String(formData.get("department") ?? "").trim() || null;
  const employeeCode = String(formData.get("employee_code") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };
  if (password && password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", userId);
  if (error) return { error: "更新に失敗しました。" };

  await supabase.from("contractor_member_profiles").upsert({
    user_id: userId,
    department,
    employee_code: employeeCode,
  });

  // パスワード変更（任意）
  if (password) {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(userId, { password });
  }

  revalidatePath("/staff");
  redirect("/staff");
}

export async function deleteStaff(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("id") ?? "");
  if (!userId) return;

  // 管理者（自分含む）はこの画面から削除させない
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .eq("company_id", me.companyId)
    .maybeSingle<{ role: string }>();
  if (!target || target.role !== "contractor_staff") return;

  await deleteManagedUser(userId);
  revalidatePath("/staff");
}
