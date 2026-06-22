"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

// LINE Messaging API の認証情報を保存（管理者のみ）。
// 空欄の項目は変更しない（既存値を保持）。
export async function updateLineSettings(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const admin = await requireAdmin();

  const token = String(formData.get("line_channel_access_token") ?? "").trim();
  const secret = String(formData.get("line_channel_secret") ?? "").trim();

  const updates: Record<string, string> = {};
  if (token) updates.line_channel_access_token = token;
  if (secret) updates.line_channel_secret = secret;

  if (Object.keys(updates).length === 0) {
    return { error: "変更する項目を入力してください。" };
  }

  // contractor_companies は RLS で更新ポリシー未定義のため service role で更新（自社に限定）
  const client = createAdminClient();
  const { error } = await client
    .from("contractor_companies")
    .update(updates)
    .eq("id", admin.companyId);

  if (error) return { error: "保存に失敗しました。" };

  revalidatePath("/settings");
  return { success: true };
}

export interface VerifyTokenState {
  error?: string;
  success?: boolean;
  accountName?: string;
  secretSet?: boolean;
}

// 送信先に依存せず、チャネルアクセストークンが有効か（公式アカウントに接続できるか）を確認。
// LINE の GET /v2/bot/info を使用（メッセージ送信なし）。
export async function verifyToken(): Promise<VerifyTokenState> {
  const admin = await requireAdmin();
  const client = createAdminClient();

  const { data: company } = await client
    .from("contractor_companies")
    .select("line_channel_access_token, line_channel_secret")
    .eq("id", admin.companyId)
    .single<{
      line_channel_access_token: string | null;
      line_channel_secret: string | null;
    }>();

  const token = company?.line_channel_access_token;
  const secretSet = !!company?.line_channel_secret;

  if (!token) {
    return { error: "チャネルアクセストークンが登録されていません。" };
  }

  const res = await fetch("https://api.line.me/v2/bot/info", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let msg = "トークンの確認に失敗しました。";
    if (res.status === 401) {
      msg = "チャネルアクセストークンが無効です。再発行して登録し直してください。";
    }
    return { error: `${msg}（コード: ${res.status}）`, secretSet };
  }

  const info = (await res.json().catch(() => ({}))) as {
    displayName?: string;
    basicId?: string;
  };
  const accountName = info.displayName
    ? `${info.displayName}${info.basicId ? `（${info.basicId}）` : ""}`
    : undefined;

  return { success: true, accountName, secretSet };
}

export interface TestSendState {
  error?: string;
  success?: boolean;
}

// 登録済みトークンで、紐付け済みユーザーへテストメッセージを送信（管理者のみ）
export async function testSend(
  _prev: TestSendState,
  formData: FormData
): Promise<TestSendState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return { error: "送信先を選択してください。" };

  const client = createAdminClient();

  const { data: company } = await client
    .from("contractor_companies")
    .select("line_channel_access_token")
    .eq("id", admin.companyId)
    .single<{ line_channel_access_token: string | null }>();

  const token = company?.line_channel_access_token;
  if (!token) {
    return { error: "先にチャネルアクセストークンを登録してください。" };
  }

  const { data: target } = await client
    .from("users")
    .select("line_user_id, name")
    .eq("id", userId)
    .eq("company_id", admin.companyId)
    .single<{ line_user_id: string | null; name: string }>();

  if (!target?.line_user_id) {
    return { error: "選択したユーザーは LINE 未紐付けです。" };
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
          text: "【テスト送信】民泊清掃管理アプリからのテストメッセージです。これが届けば LINE 連携は正常です。",
        },
      ],
    }),
  });

  if (!res.ok) {
    const status = res.status;
    let msg = "送信に失敗しました。";
    if (status === 401) {
      msg = "チャネルアクセストークンが正しくありません（認証エラー）。";
    } else if (status === 403) {
      msg = "権限エラーです。Messaging API の設定をご確認ください。";
    } else if (status === 400) {
      msg =
        "送信できませんでした。送信先が公式アカウントを友だち追加しているかご確認ください。";
    }
    return { error: `${msg}（コード: ${status}）` };
  }

  return { success: true };
}
