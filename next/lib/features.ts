// オプション（機能フラグ）= カタログ（features）＋契約（company_features）
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Feature } from "@/lib/database.types";

// オプションのカタログ一覧（運営が定義した「商品」）
export async function listFeatures(): Promise<Feature[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("features")
    .select("*")
    .order("sort", { ascending: true });
  return (data as Feature[]) ?? [];
}

// 会社の契約状態（feature_key -> enabled）
export async function getCompanyFeatureMap(
  companyId: string
): Promise<Map<string, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_features")
    .select("feature_key, enabled")
    .eq("company_id", companyId);
  return new Map(
    (data ?? []).map((r: { feature_key: string; enabled: boolean }) => [
      r.feature_key,
      r.enabled,
    ])
  );
}

// 会社で機能が「実際に有効」か。加入状況（company_features.enabled）が真実の源。
// 有料オプションの加入可否は運営（ベンダー）が /vendor で管理する。
export async function hasFeature(
  companyId: string,
  key: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("company_features")
    .select("enabled")
    .eq("company_id", companyId)
    .eq("feature_key", key)
    .maybeSingle<{ enabled: boolean }>();
  return contract?.enabled ?? false;
}

// 機能の加入 ON/OFF を保存（service role）。
export async function setCompanyFeature(
  companyId: string,
  key: string,
  enabled: boolean
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("company_features").upsert({
    company_id: companyId,
    feature_key: key,
    enabled,
    updated_at: new Date().toISOString(),
  });
}
