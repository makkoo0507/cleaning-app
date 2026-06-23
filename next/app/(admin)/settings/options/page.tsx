import { requireAdmin } from "@/lib/auth";
import { listFeatures, getContractorFeatureMap } from "@/lib/features";
import { PageHeader } from "@/components/ui";
import { setFeatureEnabled } from "../actions";

export const dynamic = "force-dynamic";

export default async function OptionSettingsPage() {
  const admin = await requireAdmin();
  const features = await listFeatures();
  const contracted = await getContractorFeatureMap(admin.contractorId);

  return (
    <div className="space-y-6">
      <PageHeader title="設定（オプション）" />
      <p className="max-w-lg text-sm text-zinc-500">
        利用できるオプション機能の一覧です。有料オプションは有料プランで利用できます。
      </p>

      {features.length === 0 && (
        <p className="text-sm text-zinc-500">利用可能なオプションはありません。</p>
      )}

      {features.map((f) => {
        const enabled = contracted.get(f.key) ?? false;
        return (
          <section
            key={f.key}
            className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {f.name}
              {f.is_paid && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  有料オプション
                </span>
              )}
            </h2>
            {f.description && (
              <p className="text-xs text-zinc-500">{f.description}</p>
            )}

            {f.is_paid ? (
              <div className="space-y-1">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  加入状況:{" "}
                  {enabled ? (
                    <span className="font-medium text-green-700 dark:text-green-300">
                      加入中
                    </span>
                  ) : (
                    <span className="font-medium text-zinc-500">未加入</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  有料オプションの加入・解約は運営（ベンダー）でのお手続きとなります。
                  ご希望の場合は運営（ベンダー）までお問い合わせください。
                </p>
              </div>
            ) : (
              <form action={setFeatureEnabled} className="space-y-2">
                <input type="hidden" name="feature_key" value={f.key} />
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={enabled}
                  />
                  この機能を利用する
                </label>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  保存
                </button>
              </form>
            )}
          </section>
        );
      })}
    </div>
  );
}
