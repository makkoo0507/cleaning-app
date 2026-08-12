// 招待トークンの検証・LINE アカウント紐付け
// GET ?token=... → { role }
// POST { inviteToken, lineUserId } → { ok: true }
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from("users")
    .select("role")
    .eq("invite_token", token)
    .single();

  if (!user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  return NextResponse.json({ role: user.role });
}

export async function POST(req: NextRequest) {
  const { inviteToken, lineUserId } = await req.json();

  if (!inviteToken || !lineUserId) {
    return NextResponse.json(
      { error: "inviteToken and lineUserId required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from("users")
    .update({ line_user_id: lineUserId, invite_token: null })
    .eq("invite_token", inviteToken)
    .select("id, role, contractor_id")
    .single<{ id: string; role: string; contractor_id: string }>();

  if (error || !user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  await sendLinkCompleteNotification(admin, user);

  return NextResponse.json({ ok: true });
}

// 連携完了を本人に通知（失敗しても紐付け自体は成功させたいのでエラーは握りつぶす）
async function sendLinkCompleteNotification(
  admin: ReturnType<typeof createAdminClient>,
  user: { id: string; role: string; contractor_id: string }
): Promise<void> {
  try {
    const { data: contractor } = await admin
      .from("contractors")
      .select("line_channel_access_token, liff_id")
      .eq("id", user.contractor_id)
      .single<{ line_channel_access_token: string | null; liff_id: string | null }>();

    const token = contractor?.line_channel_access_token;
    if (!token) return;

    const { data: linkedUser } = await admin
      .from("users")
      .select("line_user_id")
      .eq("id", user.id)
      .single<{ line_user_id: string | null }>();

    if (!linkedUser?.line_user_id) return;

    const path = user.role === "cleaner" ? "/cleaner/schedules" : "/owner/schedules";
    const label = user.role === "cleaner" ? "清掃者ページURL" : "オーナーページURL";
    const url = contractor?.liff_id
      ? `\n・${label}\nhttps://liff.line.me/${contractor.liff_id}${path}`
      : "";

    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: linkedUser.line_user_id,
        messages: [
          {
            type: "text",
            text: `LINE連携が完了しました。今後の通知はこのLINEアカウントに届きます。${url}`,
          },
        ],
      }),
    });
  } catch {
    // 通知失敗は紐付け成功に影響させない
  }
}
