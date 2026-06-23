import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { User } from "@/lib/database.types";

// 運営が業者管理者のパスワードを再設定する（運営のみ）。
export async function POST(request: NextRequest) {
  await requirePlatformAdmin();

  const form = await request.formData();
  const userId = String(form.get("user_id") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const back = (code: string) =>
    NextResponse.redirect(
      new URL(`/vendor?${code}`, request.url),
      303
    );

  if (!userId || !password) return back("error=input");
  if (password.length < 8) return back("error=password_short");

  const admin = createAdminClient();

  // 対象が業者ユーザー（運営フラグなし・会社所属）であることを確認
  const { data: target } = await admin
    .from("users")
    .select("company_id, is_platform_admin")
    .eq("id", userId)
    .maybeSingle<Pick<User, "company_id" | "is_platform_admin">>();

  if (!target || target.is_platform_admin || !target.company_id) {
    return back("error=target");
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return back("error=reset");

  return back("pw_reset=ok");
}
