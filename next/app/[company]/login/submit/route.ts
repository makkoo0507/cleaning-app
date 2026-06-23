import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyBySlug } from "@/lib/company";
import type { User } from "@/lib/database.types";

// 業者別ログインの送信先（ネイティブ form POST）。
// Server Action（fetch）ではなく通常のフォーム送信＋リダイレクトにすることで、
// ブラウザのパスワードマネージャーに「保存しますか？」を出させる。
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ company: string }> }
) {
  const { company: slug } = await params;
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const loginUrl = new URL(`/${slug}/login`, request.url);
  const fail = (code: string) => {
    loginUrl.searchParams.set("error", code);
    return NextResponse.redirect(loginUrl, 303);
  };

  if (!email || !password) return fail("input");

  const company = await getCompanyBySlug(slug);
  if (!company) return NextResponse.redirect(new URL("/", request.url), 303);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return fail("auth");

  // 所属テナントが URL の業者と一致するか検証
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", data.user.id)
    .maybeSingle<Pick<User, "company_id">>();

  if (!profile || profile.company_id !== company.id) {
    await supabase.auth.signOut();
    return fail("company");
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
