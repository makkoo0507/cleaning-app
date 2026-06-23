"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { setContractorFeature } from "@/lib/features";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

// 定期リマインドの送信先・タイミング設定（管理者のみ）
export async function updateReminderSettings(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const client = createAdminClient();
  await client
    .from("contractors")
    .update({
      reminder_cleaner_prev_day: formData.get("cleaner_prev") != null,
      reminder_cleaner_same_day: formData.get("cleaner_same") != null,
      reminder_owner_prev_day: formData.get("owner_prev") != null,
      reminder_owner_same_day: formData.get("owner_same") != null,
    })
    .eq("id", admin.contractorId);
  revalidatePath("/settings/reminder");
}

// オプション（機能）の利用 ON/OFF（管理者のみ）。有料オプションの有効化は有料プランのみ。
export async function setFeatureEnabled(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const key = String(formData.get("feature_key") ?? "");
  if (!key) return;
  const enabled = formData.get("enabled") != null;

  // 有料オプションの加入・解約は運営のみ（業者管理者は変更不可）
  const client = createAdminClient();
  const { data: feat } = await client
    .from("features")
    .select("is_paid")
    .eq("key", key)
    .maybeSingle<{ is_paid: boolean }>();
  if (feat?.is_paid) return;

  await setContractorFeature(admin.contractorId, key, enabled);
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

  // contractors は RLS で更新ポリシー未定義のため service role で更新（自社に限定）
  const client = createAdminClient();
  const { error } = await client
    .from("contractors")
    .update(updates)
    .eq("id", admin.contractorId);

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

  const { data: contractor } = await client
    .from("contractors")
    .select("line_channel_access_token, line_channel_secret")
    .eq("id", admin.contractorId)
    .single<{
      line_channel_access_token: string | null;
      line_channel_secret: string | null;
    }>();

  const token = contractor?.line_channel_access_token;
  const secretSet = !!contractor?.line_channel_secret;

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
