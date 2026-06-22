// LINE ユーザーID → Supabase セッションを Cookie に発行する
// 清掃者・物件関係者が LIFF でログインする際に使用。
// verifyOtp までサーバー側で行い、ブラウザは Supabase に直接アクセスしない。
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { lineUserId, role } = await req.json();

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // role 指定があればそのロールのユーザーを選ぶ。
  // （開発時に同一 LINE アカウントを清掃者/オーナー両方に紐付けても、
  //   今いる画面の role でログイン対象を一意に決められる）
  let query = admin
    .from("users")
    .select("id, role")
    .eq("line_user_id", lineUserId);
  if (role) query = query.eq("role", role);

  const { data: rows } = await query.limit(1);
  const user = rows?.[0] as { id: string; role: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { data: authData } = await admin.auth.admin.getUserById(user.id);
  const email = authData.user?.email;
  if (!email) {
    return NextResponse.json({ error: "auth_user_not_found" }, { status: 404 });
  }

  // マジックリンクの token_hash を生成
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({ type: "magiclink", email });

  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    return NextResponse.json(
      { error: "failed_to_generate_link" },
      { status: 500 }
    );
  }

  // サーバー側で検証してセッション Cookie を発行（SSR クライアント）
  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });

  if (otpError) {
    return NextResponse.json({ error: "verify_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: user.role });
}
