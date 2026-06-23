"use server";

import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User } from "@/lib/database.types";

export interface TestNotifyResult {
  error?: string;
  success?: boolean;
}

// 指定ユーザーへテスト通知を送信（清掃者/オーナーの紐付け確認用）
export async function sendTestNotification(
  userId: string
): Promise<TestNotifyResult> {
  const me = await requireContractor();
  const client = createAdminClient();

  const { data: company } = await client
    .from("contractors")
    .select("line_channel_access_token")
    .eq("id", me.companyId)
    .single<{ line_channel_access_token: string | null }>();

  const token = company?.line_channel_access_token;
  if (!token) {
    return { error: "先に設定画面でチャネルアクセストークンを登録してください。" };
  }

  const { data: target } = await client
    .from("users")
    .select("line_user_id, name")
    .eq("id", userId)
    .eq("company_id", me.companyId)
    .single<{ line_user_id: string | null; name: string }>();

  if (!target?.line_user_id) {
    return { error: "この相手は LINE 未紐付けです。" };
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: target.line_user_id,
      messages: [
        {
          type: "text",
          text: "【テスト通知】民泊清掃管理アプリからのテストです。これが届けば通知設定は正常です。",
        },
      ],
    }),
  });

  if (!res.ok) {
    const status = res.status;
    let msg = "送信に失敗しました。";
    if (status === 401)
      msg = "チャネルアクセストークンが正しくありません（認証エラー）。";
    else if (status === 403)
      msg = "権限エラーです。Messaging API の設定をご確認ください。";
    else if (status === 400)
      msg =
        "送信できませんでした。相手が公式アカウントを友だち追加しているかご確認ください。";
    return { error: `${msg}（コード: ${status}）` };
  }

  return { success: true };
}

// ログアウト: 所属会社の slug を引いてから会社別ログインURLへ戻す
export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let slug: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle<Pick<User, "company_id">>();
    if (data) {
      const { data: company } = await supabase
        .from("contractors")
        .select("slug")
        .eq("id", data.company_id)
        .maybeSingle<{ slug: string | null }>();
      slug = company?.slug ?? null;
    }
  }

  await supabase.auth.signOut();
  redirect(slug ? `/${slug}/login` : "/");
}
