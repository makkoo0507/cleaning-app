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
  const me = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  const department = String(formData.get("department") ?? "").trim() || null;
  const employeeCode = String(formData.get("employee_code") ?? "").trim() || null;

  if (!name) return { error: "名前は必須です。" };
  if (!email) return { error: "メールアドレスは必須です。" };
  if (roleRaw !== "contractor_admin" && roleRaw !== "contractor_staff") {
    return { error: "役職を選択してください。" };
  }
  const role = roleRaw as "contractor_admin" | "contractor_staff";
  if (password && password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }

  const adminClient = createAdminClient();

  // 対象ユーザーの現在の役職（自社のみ）
  const { data: target } = await adminClient
    .from("users")
    .select("role")
    .eq("id", userId)
    .eq("company_id", me.companyId)
    .maybeSingle<{ role: string }>();
  if (!target) return { error: "対象が見つかりません。" };

  // 最後の管理者を降格させない
  if (target.role === "contractor_admin" && role !== "contractor_admin") {
    const { count } = await adminClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", me.companyId)
      .eq("role", "contractor_admin");
    if ((count ?? 0) <= 1) {
      return {
        error:
          "最後の管理者は降格できません。先に別のユーザーを管理者にしてください。",
      };
    }
  }

  // 名前・役職
  const { error } = await adminClient
    .from("users")
    .update({ name, role })
    .eq("id", userId)
    .eq("company_id", me.companyId);
  if (error) return { error: "更新に失敗しました。" };

  await adminClient.from("contractor_member_profiles").upsert({
    user_id: userId,
    department,
    employee_code: employeeCode,
  });

  // メールアドレス変更（変更があった場合のみ）
  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  if (email !== (authUser.user?.email ?? "")) {
    const { error: emailErr } = await adminClient.auth.admin.updateUserById(
      userId,
      { email, email_confirm: true }
    );
    if (emailErr) {
      return {
        error: emailErr.message.toLowerCase().includes("already")
          ? "このメールアドレスは既に使用されています。"
          : "メールアドレスの変更に失敗しました。",
      };
    }
  }

  // パスワード変更（任意）
  if (password) {
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
