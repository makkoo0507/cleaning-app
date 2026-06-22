import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import { updateReminderSettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReminderSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("contractor_companies")
    .select(
      "reminder_to_cleaner, reminder_to_owner, reminder_prev_day, reminder_same_day"
    )
    .eq("id", admin.companyId)
    .single<
      Pick<
        ContractorCompany,
        | "reminder_to_cleaner"
        | "reminder_to_owner"
        | "reminder_prev_day"
        | "reminder_same_day"
      >
    >();

  return (
    <div className="space-y-6">
      <PageHeader title="設定（定期送信）" />
      <p className="max-w-lg text-sm text-zinc-500">
        清掃予定を LINE で自動リマインドします。送信先とタイミングを選べます。
        （実際の自動送信を動かすには、初回のみ
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

      <section className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <form action={updateReminderSettings} className="space-y-4">
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
