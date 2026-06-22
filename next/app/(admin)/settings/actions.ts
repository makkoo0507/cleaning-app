"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

// 定期リマインドの送信先・タイミング設定（管理者のみ）
export async function updateReminderSettings(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const client = createAdminClient();
  await client
    .from("contractor_companies")
    .update({
      reminder_to_cleaner: formData.get("to_cleaner") != null,
      reminder_to_owner: formData.get("to_owner") != null,
      reminder_prev_day: formData.get("prev_day") != null,
      reminder_same_day: formData.get("same_day") != null,
    })
    .eq("id", admin.companyId);
  revalidatePath("/settings/reminder");
}

// 請求・支払い機能の利用 ON/OFF（管理者のみ）。有効化は有料プランのみ。
export async function setBillingEnabled(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const enabled = formData.get("billing_enabled") != null;
  const client = createAdminClient();

  // 有効化は有料プランのみ許可（無効化は常に可）
  if (enabled) {
    const { data: company } = await client
      .from("contractor_companies")
      .select("plan")
      .eq("id", admin.companyId)
      .maybeSingle<{ plan: string }>();
    if (company?.plan !== "paid") return;
  }

  await client
    .from("contractor_companies")
    .update({ billing_enabled: enabled })
    .eq("id", admin.companyId);
  revalidatePath("/settings/options");
  revalidatePath("/", "layout");
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
