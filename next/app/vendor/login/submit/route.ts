import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User } from "@/lib/database.types";

// ベンダー運営ログイン（ネイティブ form POST）。
// 認証後、role = platform_admin を確認する。
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const loginUrl = new URL("/vendor/login", request.url);
  const fail = (code: string) => {
    loginUrl.searchParams.set("error", code);
    return NextResponse.redirect(loginUrl, 303);
  };

  if (!email || !password) return fail("input");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return fail("auth");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<Pick<User, "role">>();

  if (profile?.role !== "platform_admin") {
    await supabase.auth.signOut();
    return fail("forbidden");
  }

  return NextResponse.redirect(new URL("/vendor", request.url), 303);
}
