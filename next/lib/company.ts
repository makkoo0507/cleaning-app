// 会社（テナント）の参照ヘルパー
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Contractor } from "@/lib/database.types";

// 自社のプラン・主要機能フラグを取得。
// billingEnabled: 請求・支払いオプションが実際に有効か（有料プラン＋契約ON）
// isPaid: 有料プランか
export async function getContractorName(contractorId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contractors")
    .select("name")
    .eq("id", contractorId)
    .maybeSingle<{ name: string }>();
  return data?.name ?? "民泊清掃管理";
}

export async function getContractorFlags(
  contractorId: string
): Promise<{ billingEnabled: boolean; isPaid: boolean }> {
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("contractors")
    .select("plan")
    .eq("id", contractorId)
    .maybeSingle<{ plan: string }>();
  const isPaid = company?.plan === "paid";

  const { data: contract } = await supabase
    .from("contractor_features")
    .select("enabled")
    .eq("contractor_id", contractorId)
    .eq("feature_key", "billing")
    .maybeSingle<{ enabled: boolean }>();

  return {
    // 加入状況（運営が管理）が真実の源
    billingEnabled: contract?.enabled ?? false,
    isPaid,
  };
}

// slug から会社を取得（未認証のログインページから呼ぶため service role を使用）
export async function getCompanyBySlug(
  slug: string
): Promise<Pick<Contractor, "id" | "name" | "slug"> | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("contractors")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle<Pick<Contractor, "id" | "name" | "slug">>();
  return data ?? null;
}
