"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanyBySlug } from "@/lib/company";
import type { User } from "@/lib/database.types";

export interface LoginState {
  error?: string;
}

// 会社別ログイン: slug の会社に所属するユーザーのみ許可する
export async function loginToCompany(
  slug: string,
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const company = await getCompanyBySlug(slug);
  if (!company) {
    return { error: "ログインページが見つかりません。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "ログインに失敗しました。入力内容をご確認ください。" };
  }

  // 所属テナントが URL の会社と一致するか検証
  // 注: auth hook が JWT に注入する company_id は user.app_metadata には載らないため、
  //     public.users から実際の所属会社を取得して比較する。
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", data.user.id)
    .maybeSingle<Pick<User, "company_id">>();

  if (!profile || profile.company_id !== company.id) {
    await supabase.auth.signOut();
    return {
      error: "このアカウントはこの会社のログインページでは使用できません。",
    };
  }

  redirect("/dashboard");
}
