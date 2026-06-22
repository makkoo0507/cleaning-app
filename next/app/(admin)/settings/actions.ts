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
