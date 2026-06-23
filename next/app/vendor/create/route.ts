import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// 運営メールから会社ごとのベンダー用エイリアスを作る（例 makkoo0507+beach@gmail.com）
function vendorAlias(email: string | undefined, slug: string): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  return `${local}+${slug}@${domain}`;
}

// 会社＋その管理者アカウントを一括発行（運営のみ・ネイティブ form POST）。
export async function POST(request: NextRequest) {
  const vendor = await requirePlatformAdmin();

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

  // エラー時は入力値（パスワード以外）を引き継いで再表示する
  const back = (code: string) => {
    const p = new URLSearchParams({ error: code });
    if (companyName) p.set("company_name", companyName);
    if (slug) p.set("slug", slug);
    if (plan) p.set("plan", plan);
    if (adminName) p.set("admin_name", adminName);
    if (adminEmail) p.set("admin_email", adminEmail);
    return NextResponse.redirect(new URL(`/vendor?${p}`, request.url), 303);
  };

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
  });
  if (userErr) {
    await admin.from("contractor_companies").delete().eq("id", company.id);
    await admin.auth.admin.deleteUser(userId);
    return back("user");
  }
  await admin.from("contractor_member_profiles").insert({ user_id: userId });

  // ベンダー用の隠し管理者を作成（運営が /{slug}/login から入るための常設アカウント）
  // 初期パスワードは会社管理者と同じ（運営が把握済み）。後で /vendor から変更可能。
  const alias = vendorAlias(vendor.email, slug);
  if (alias) {
    const { data: vCreated } = await admin.auth.admin.createUser({
      email: alias,
      password: adminPassword,
      email_confirm: true,
    });
    if (vCreated?.user) {
      await admin.from("users").insert({
        id: vCreated.user.id,
        company_id: company.id,
        role: "contractor_vendor",
        name: "運営管理（ベンダー）",
        is_platform_admin: false,
      });
      await admin
        .from("contractor_member_profiles")
        .insert({ user_id: vCreated.user.id });
    }
  }

  return NextResponse.redirect(
    new URL(`/vendor?created=${encodeURIComponent(slug)}`, request.url),
    303
  );
}
