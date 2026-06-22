import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import SettingsForm from "./SettingsForm";
import { setBillingEnabled } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("contractor_companies")
    .select("line_channel_access_token, line_channel_secret, billing_enabled")
    .eq("id", admin.companyId)
    .single<
      Pick<
        ContractorCompany,
        "line_channel_access_token" | "line_channel_secret" | "billing_enabled"
      >
    >();

  const billingEnabled = company?.billing_enabled ?? true;

  return (
    <div className="space-y-6">
      <PageHeader title="設定" />

      <section className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          機能の利用
        </h2>
        <form action={setBillingEnabled} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="billing_enabled"
              defaultChecked={billingEnabled}
            />
            請求・支払い機能を利用する
          </label>
          <p className="text-xs text-zinc-500">
            オフにすると、メニューと請求・支払い画面・案件の金額入力欄が非表示になります。
          </p>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            保存
          </button>
        </form>
      </section>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        LINE連携
      </h2>
      <p className="max-w-lg text-sm text-zinc-500">
        自社の LINE 公式アカウント（Messaging API チャネル）の認証情報を登録します。
        登録すると、スケジュール作成・清掃完了時の LINE 通知が自社アカウントから送信されます。
        値はマスク表示され、保存後は再表示されません。
      </p>

      <a
        href="/manual/line-setup"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-zinc-400 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        📄 設定マニュアルを開く（別タブ）
      </a>
      <SettingsForm
        tokenSet={!!company?.line_channel_access_token}
        secretSet={!!company?.line_channel_secret}
      />

      <p className="max-w-lg text-xs text-zinc-500">
        ※ 個々の清掃者・オーナーに通知が届くかの「テスト通知」は、
        清掃者管理／オーナー管理の各編集画面（紐付け済みの場合）から行えます。
      </p>

      <p className="max-w-lg text-xs text-zinc-500">
        ※ 公式アカウントのメニューにスケジュール画面を開くボタンを置く設定は、
        <a
          href="/manual/rich-menu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          リッチメニュー設定マニュアル
        </a>
        を参照してください（Mini App の URL も記載しています）。
      </p>
    </div>
  );
}
