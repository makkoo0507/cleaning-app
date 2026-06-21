// 認証済みユーザー・テナント情報の取得ヘルパー（サーバー専用）
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppMetadata, User, UserRole } from "@/lib/database.types";

export interface CurrentUser {
  id: string;
  email: string | undefined;
  companyId: string;
  role: UserRole;
  profile: User;
}

// ログイン必須。未認証なら /login へ。
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const meta = (user.app_metadata ?? {}) as AppMetadata;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single<User>();

  if (!profile) redirect("/");

  return {
    id: user.id,
    email: user.email,
    companyId: meta.company_id ?? profile.company_id,
    role: meta.role ?? profile.role,
    profile,
  };
}

// 管理者・社員のみ許可（清掃者/関係者は管理 Web 不可）
export async function requireContractor(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "contractor_admin" && user.role !== "contractor_staff") {
    redirect("/");
  }
  return user;
}

// 管理者のみ許可
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireContractor();
  if (user.role !== "contractor_admin") {
    redirect("/dashboard");
  }
  return user;
}

export function isAdmin(user: CurrentUser): boolean {
  return user.role === "contractor_admin";
}
