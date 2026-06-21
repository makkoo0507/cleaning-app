// LINE ユーザーID → Supabase マジックリンク token_hash を返す
// 清掃者・物件関係者がLIFFでセッションを取得する際に使用
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { lineUserId } = await req.json();

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { data: authData } = await admin.auth.admin.getUserById(user.id);
  const email = authData.user?.email;
  if (!email) {
    return NextResponse.json({ error: "auth_user_not_found" }, { status: 404 });
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: "failed_to_generate_link" }, { status: 500 });
  }

  return NextResponse.json({ tokenHash: data.properties.hashed_token });
}
