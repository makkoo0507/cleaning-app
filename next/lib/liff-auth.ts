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
  companyId: string;
  role: UserRole;
}

// 役割ごとの LIFF ID（クライアントに渡してログイン初期化に使う）
export const LIFF_IDS: Record<"cleaner" | "contact", string> = {
  cleaner: process.env.NEXT_PUBLIC_LIFF_ID_CLEANER ?? "",
  contact: process.env.NEXT_PUBLIC_LIFF_ID_OWNER ?? "",
};

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
    .select("id, name, company_id, role")
    .eq("id", user.id)
    .single<{ id: string; name: string; company_id: string; role: UserRole }>();

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    companyId: data.company_id,
    role: data.role,
  };
}
