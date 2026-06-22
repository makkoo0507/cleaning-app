import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// 会社＋その管理者アカウントを一括発行（運営のみ・ネイティブ form POST）。
export async function POST(request: NextRequest) {
  await requirePlatformAdmin();

  const form = await request.formData();
  const companyName = String(form.get("company_name") ?? "").trim();
  const slug = String(form.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const plan = String(form.get("plan") ?? "free");
  const adminName = String(form.get("admin_name") ?? "").trim();
  const adminEmail = String(form.get("admin_email") ?? "")
    .trim()
    .toLowerCase();
  const adminPassword = String(form.get("admin_password") ?? "");

  const back = (code: string) =>
    NextResponse.redirect(
      new URL(`/vendor?error=${encodeURIComponent(code)}`, request.url),
      303
    );

  if (!companyName || !slug || !adminName || !adminEmail || !adminPassword) {
    return back("input");
  }
  if (!/^[a-z0-9-]+$/.test(slug)) return back("slug_format");
  if (adminPassword.length < 8) return back("password_short");

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("contractor_companies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return back("slug_taken");

  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });
  if (authErr || !created.user) {
    return back(authErr?.message?.includes("already") ? "email_taken" : "auth");
  }
  const userId = created.user.id;

  const { data: company, error: companyErr } = await admin
    .from("contractor_companies")
    .insert({ name: companyName, slug, plan: plan === "paid" ? "paid" : "free" })
    .select("id")
    .single<{ id: string }>();
  if (companyErr || !company) {
    await admin.auth.admin.deleteUser(userId);
    return back("company");
  }

  const { error: userErr } = await admin.from("users").insert({
    id: userId,
    company_id: company.id,
    role: "contractor_admin",
    name: adminName,
    is_platform_admin: false,
  });
  if (userErr) {
    await admin.from("contractor_companies").delete().eq("id", company.id);
    await admin.auth.admin.deleteUser(userId);
    return back("user");
  }
  await admin.from("contractor_member_profiles").insert({ user_id: userId });

  return NextResponse.redirect(
    new URL(`/vendor?created=${encodeURIComponent(slug)}`, request.url),
    303
  );
}
