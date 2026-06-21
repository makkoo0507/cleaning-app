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
    .select("id")
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
