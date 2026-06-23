// 認証済みユーザー・テナント情報の取得ヘルパー（サーバー専用）
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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

// 管理者・閲覧者のみ許可（清掃者/関係者は管理 Web 不可）
export async function requireContractor(): Promise<CurrentUser> {
  const user = await requireUser();
  // 運営（会社未所属）は業者向け管理Web対象外。ベンダー画面へ。
  if (!user.companyId) redirect("/vendor");
  if (user.role !== "contractor_admin" && user.role !== "contractor_viewer") {
    redirect("/");
  }
  return user;
}

export interface PlatformAdmin {
  id: string;
  email: string | undefined;
  name: string;
}

// プラットフォーム管理者（ベンダー運営）のみ許可。
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/vendor/login");

  // RLS に依存せず service_role でロールを確認
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle<Pick<User, "name" | "role">>();

  if (data?.role !== "platform_admin") redirect("/vendor/login");

  return { id: user.id, email: user.email, name: data.name };
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
