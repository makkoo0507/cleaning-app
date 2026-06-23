// 会社（テナント）の参照ヘルパー
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";

// 自社の機能フラグ・プランを取得。RLS の「自社のみ参照」で取得可。
// billingEnabled: 請求・支払いの利用ON/OFF
// isPaid: 有料プランか（有料オプションの利用可否判定に使用）
export async function getCompanyFlags(
  companyId: string
): Promise<{ billingEnabled: boolean; isPaid: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contractor_companies")
    .select("billing_enabled, plan")
    .eq("id", companyId)
    .maybeSingle<{ billing_enabled: boolean; plan: string }>();
  const isPaid = data?.plan === "paid";
  return {
    // 請求・支払いは有料オプション。有料プランかつフラグONのときだけ有効。
    billingEnabled: isPaid && (data?.billing_enabled ?? false),
    isPaid,
  };
}

// slug から会社を取得（未認証のログインページから呼ぶため service role を使用）
export async function getCompanyBySlug(
  slug: string
): Promise<Pick<ContractorCompany, "id" | "name" | "slug"> | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("contractor_companies")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle<Pick<ContractorCompany, "id" | "name" | "slug">>();
  return data ?? null;
}
