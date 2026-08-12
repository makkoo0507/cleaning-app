"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContractor, requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User } from "@/lib/database.types";

export interface TestNotifyResult {
  error?: string;
  success?: boolean;
}

export interface UnlinkLineResult {
  error?: string;
  success?: boolean;
}

// LINE 紐付けを解除し、招待URLを再発行する（清掃者/オーナーの再紐付け用）
export async function unlinkLine(
  userId: string,
  redirectPath: string
): Promise<UnlinkLineResult> {
  const me = await requireAdmin();
  const client = createAdminClient();

  const { data, error } = await client
    .from("users")
    .update({ line_user_id: null, invite_token: crypto.randomUUID() })
    .eq("id", userId)
    .eq("contractor_id", me.contractorId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "紐付け解除に失敗しました。" };
  }

  revalidatePath(redirectPath);
  return { success: true };
}

// 指定ユーザーへテスト通知を送信（清掃者/オーナーの紐付け確認用）
export async function sendTestNotification(
  userId: string
): Promise<TestNotifyResult> {
  const me = await requireContractor();
  const client = createAdminClient();

  const { data: contractor } = await client
    .from("contractors")
    .select("line_channel_access_token, liff_id")
    .eq("id", me.contractorId)
    .single<{ line_channel_access_token: string | null; liff_id: string | null }>();

  const token = contractor?.line_channel_access_token;
  if (!token) {
    return { error: "先に設定画面でチャネルアクセストークンを登録してください。" };
  }

  const { data: target } = await client
    .from("users")
    .select("line_user_id, name, role")
    .eq("id", userId)
    .eq("contractor_id", me.contractorId)
    .single<{ line_user_id: string | null; name: string; role: string }>();

  if (!target?.line_user_id) {
    return { error: "この相手は LINE 未紐付けです。" };
  }

  const liffId = contractor?.liff_id;
  const path = target.role === "cleaner" ? "/cleaner/schedules" : "/owner/schedules";
  const url = liffId ? `\nhttps://liff.line.me/${liffId}${path}` : "";

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
          text: `【テスト通知】民泊清掃管理アプリからのテストです。これが届けば通知設定は正常です。${url}`,
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
      .select("contractor_id")
      .eq("id", user.id)
      .maybeSingle<Pick<User, "contractor_id">>();
    if (data) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("slug")
        .eq("id", data.contractor_id)
        .maybeSingle<{ slug: string | null }>();
      slug = contractor?.slug ?? null;
    }
  }

  await supabase.auth.signOut();
  redirect(slug ? `/${slug}/login` : "/");
}
