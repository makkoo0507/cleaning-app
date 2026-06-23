import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Contractor } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import { updateReminderSettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReminderSettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: contractor } = await supabase
    .from("contractors")
    .select(
      "reminder_cleaner_prev_day, reminder_cleaner_same_day, reminder_owner_prev_day, reminder_owner_same_day"
    )
    .eq("id", admin.contractorId)
    .single<
      Pick<
        Contractor,
        | "reminder_cleaner_prev_day"
        | "reminder_cleaner_same_day"
        | "reminder_owner_prev_day"
        | "reminder_owner_same_day"
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
        <p className="text-sm text-zinc-500">
          送信先ごとに、前日・当日のどちらに送るかを選べます
          （例: オーナーは当日のみ、清掃者は前日と当日）。
        </p>
        <p className="text-sm text-zinc-500">
          送信時刻の目安: <strong>前日 = 20:00 頃</strong>／
          <strong>当日 = 朝 8:00 頃</strong>（日本時間）。
        </p>
        <form action={updateReminderSettings} className="space-y-4">
          <table className="text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">送信先</th>
                <th className="px-3 py-2 font-medium">前日（20:00頃）</th>
                <th className="px-3 py-2 font-medium">当日（朝8:00頃）</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  清掃者
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="cleaner_prev"
                    defaultChecked={contractor?.reminder_cleaner_prev_day ?? true}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="cleaner_same"
                    defaultChecked={contractor?.reminder_cleaner_same_day ?? false}
                  />
                </td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  オーナー（通知ONの関係者）
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="owner_prev"
                    defaultChecked={contractor?.reminder_owner_prev_day ?? false}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="owner_same"
                    defaultChecked={contractor?.reminder_owner_same_day ?? false}
                  />
                </td>
              </tr>
            </tbody>
          </table>
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
