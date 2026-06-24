import { requireAdmin } from "@/lib/auth";
import { getNotificationSettings } from "@/lib/notifications";
import { PageHeader } from "@/components/ui";
import { updateReminderSettings } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReminderSettingsPage() {
  const admin = await requireAdmin();
  const settings = await getNotificationSettings(admin.contractorId);

  const get = (recipient: string, trigger: string) =>
    settings.get(`${recipient}:${trigger}` as Parameters<typeof settings.get>[0]) ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="設定（通知設定）" />

      <form action={updateReminderSettings} className="space-y-6">
        {/* スケジュール作成時通知 */}
        <section className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              スケジュール作成時の通知
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              スケジュールを作成した際に LINE 通知を送るかどうかを設定します。
            </p>
          </div>
          <table className="text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">送信先</th>
                <th className="px-3 py-2 font-medium">送信する</th>
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
                    name="cleaner_job_created"
                    defaultChecked={settings.get("cleaner:job_created") ?? false}
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
                    name="owner_job_created"
                    defaultChecked={settings.get("owner:job_created") ?? false}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 清掃完了時通知 */}
        <section className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              清掃完了時の通知
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              清掃者が完了を記録した際に LINE 通知を送るかどうかを設定します。
            </p>
          </div>
          <table className="text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">送信先</th>
                <th className="px-3 py-2 font-medium">送信する</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  オーナー（通知ONの関係者）
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="owner_job_completed"
                    defaultChecked={get("owner", "job_completed")}
                  />
                </td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  業者スタッフ（管理者・閲覧者）
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="staff_job_completed"
                    defaultChecked={get("staff", "job_completed")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* リマインド通知 */}
        <section className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              定期リマインド通知
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              清掃予定を LINE で自動リマインドします。送信先とタイミングを選べます。
              （実際の自動送信を動かすには、初回のみ
              <a
                href="/manual/reminder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                定期リマインドの設定
              </a>
              が必要です）
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              送信時刻の目安: <strong>前日 = 20:00 頃</strong>／
              <strong>当日 = 朝 8:00 頃</strong>（日本時間）。
            </p>
          </div>
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
                    defaultChecked={get("cleaner", "reminder_prev_day")}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="cleaner_same"
                    defaultChecked={get("cleaner", "reminder_same_day")}
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
                    defaultChecked={get("owner", "reminder_prev_day")}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    name="owner_same"
                    defaultChecked={get("owner", "reminder_same_day")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          保存
        </button>
      </form>
    </div>
  );
}
