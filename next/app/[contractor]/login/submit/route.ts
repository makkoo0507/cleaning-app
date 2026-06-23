import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContractorBySlug } from "@/lib/contractor";
import type { User } from "@/lib/database.types";

// 業者別ログインの送信先（ネイティブ form POST）。
// Server Action（fetch）ではなく通常のフォーム送信＋リダイレクトにすることで、
// ブラウザのパスワードマネージャーに「保存しますか？」を出させる。
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractor: string }> }
) {
  const { contractor: slug } = await params;
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const loginUrl = new URL(`/${slug}/login`, request.url);
  const fail = (code: string) => {
    loginUrl.searchParams.set("error", code);
    return NextResponse.redirect(loginUrl, 303);
  };

  if (!email || !password) return fail("input");

  const contractor = await getContractorBySlug(slug);
  if (!contractor) return NextResponse.redirect(new URL("/", request.url), 303);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return fail("auth");

  // 所属テナントが URL の業者と一致するか検証
  const { data: profile } = await supabase
    .from("users")
    .select("contractor_id")
    .eq("id", data.user.id)
    .maybeSingle<Pick<User, "contractor_id">>();

  if (!profile || profile.contractor_id !== contractor.id) {
    await supabase.auth.signOut();
    return fail("company");
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
