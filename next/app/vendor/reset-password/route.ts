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

  // 対象は contractor_vendor ロールのアカウントに限定
  const { data: target } = await admin
    .from("users")
    .select("company_id, role")
    .eq("id", userId)
    .maybeSingle<Pick<User, "company_id" | "role">>();

  if (!target || !target.company_id || target.role !== "contractor_vendor") {
    return back("error=target");
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return back("error=reset");

  return back("pw_reset=ok");
}
