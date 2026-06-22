import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import { setBillingEnabled } from "../actions";

export const dynamic = "force-dynamic";

export default async function OptionSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("contractor_companies")
    .select("billing_enabled, plan")
    .eq("id", admin.companyId)
    .single<Pick<ContractorCompany, "billing_enabled" | "plan">>();

  const billingEnabled = company?.billing_enabled ?? true;
  const isPaid = company?.plan === "paid";

  return (
    <div className="space-y-6">
      <PageHeader title="設定（オプション）" />
      <p className="max-w-lg text-sm text-zinc-500">
        有料オプション機能の利用設定です。
      </p>

      <section className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          請求・支払い機能
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            有料オプション
          </span>
        </h2>
        <p className="text-xs text-zinc-500">
          案件ごとの請求額・支払い額の記録、月次集計、CSV
          出力ができます。有料プランで利用できます。
        </p>

        {isPaid ? (
          <form action={setBillingEnabled} className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="billing_enabled"
                defaultChecked={billingEnabled}
              />
              請求・支払い機能を利用する
            </label>
            <p className="text-xs text-zinc-500">
              オフにすると、メニュー・請求画面・案件の金額入力欄が非表示になります。
            </p>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              保存
            </button>
          </form>
        ) : (
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            現在のプランは無料プランです。この機能を利用するには有料プランへのアップグレードが必要です。
            （プラン変更の窓口にお問い合わせください）
          </p>
        )}
      </section>
    </div>
  );
}
