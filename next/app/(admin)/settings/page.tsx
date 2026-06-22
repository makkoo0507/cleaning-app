import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import SettingsForm from "./SettingsForm";
import { updateReminderSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("contractor_companies")
    .select(
      "line_channel_access_token, line_channel_secret, reminder_to_cleaner, reminder_to_owner, reminder_prev_day, reminder_same_day"
    )
    .eq("id", admin.companyId)
    .single<
      Pick<
        ContractorCompany,
        | "line_channel_access_token"
        | "line_channel_secret"
        | "reminder_to_cleaner"
        | "reminder_to_owner"
        | "reminder_prev_day"
        | "reminder_same_day"
      >
    >();

  return (
    <div className="space-y-6">
      <PageHeader title="設定（LINE連携）" />
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

      <section className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          定期リマインド設定
        </h2>
        <p className="text-sm text-zinc-500">
          清掃予定をLINEで自動リマインドします。送信先とタイミングを選べます。
          （実際の送信には
          <a
            href="/manual/reminder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            定期送信の設定
          </a>
          が必要です）
        </p>
        <form action={updateReminderSettings} className="space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              送信先
            </p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="to_cleaner"
                  defaultChecked={company?.reminder_to_cleaner ?? true}
                />
                清掃者
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="to_owner"
                  defaultChecked={company?.reminder_to_owner ?? false}
                />
                オーナー（通知ONの関係者）
              </label>
            </div>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              タイミング
            </p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="prev_day"
                  defaultChecked={company?.reminder_prev_day ?? true}
                />
                前日
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="same_day"
                  defaultChecked={company?.reminder_same_day ?? false}
                />
                当日
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            保存
          </button>
        </form>
      </section>
    </div>
  );
}
