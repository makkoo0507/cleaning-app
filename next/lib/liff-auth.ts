// LIFF（清掃者・オーナー）用のサーバーサイド認証・データ取得ヘルパー
//
// 方針: ブラウザは Supabase に直接アクセスせず、Next サーバー経由でのみデータを扱う。
//   - 認証: /api/liff/auth が Cookie にセッションを発行（@supabase/ssr）
//   - 取得: Server Component から本ヘルパーで取得（本人の所属に明示スコープ）
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export interface LiffUser {
  id: string;
  name: string;
  contractorId: string;
  role: UserRole;
}

// 業者ごとに LINE 公式アカウント(Messaging API)と同じプロバイダー内に
// LIFF チャネルを作ってもらうことで、通知 push API の userId 不一致
// (400 エラー)を防ぐ。LIFF ID は業者ごとに固有。

// 業者の slug から、その業者専用の LIFF ID を解決する。
// 未設定の場合は null（LiffBootstrap 側で「設定がありません」を表示する）。
export async function getLiffIdBySlug(slug: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("contractors")
    .select("liff_id")
    .eq("slug", slug)
    .maybeSingle<{ liff_id: string | null }>();

  return data?.liff_id || null;
}

// Cookie のセッションから現在の LIFF ユーザーを取得（未認証なら null）
export async function getLiffUser(): Promise<LiffUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, name, contractor_id, role")
    .eq("id", user.id)
    .single<{ id: string; name: string; contractor_id: string; role: UserRole }>();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    contractorId: data.contractor_id,
    role: data.role,
  };
}
