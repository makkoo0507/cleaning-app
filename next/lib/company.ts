// 会社（テナント）の参照ヘルパー
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";

// 自社の機能フラグを取得（請求・支払いの利用可否など）。RLS の「自社のみ参照」で取得可。
export async function getCompanyFlags(
  companyId: string
): Promise<{ billingEnabled: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contractor_companies")
    .select("billing_enabled")
    .eq("id", companyId)
    .maybeSingle<{ billing_enabled: boolean }>();
  return { billingEnabled: data?.billing_enabled ?? true };
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
