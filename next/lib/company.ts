// 会社（テナント）の参照ヘルパー
import { createAdminClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";

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
