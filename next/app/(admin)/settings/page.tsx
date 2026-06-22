import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContractorCompany } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import CopyButton from "@/components/CopyButton";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("contractor_companies")
    .select("line_channel_access_token, line_channel_secret")
    .eq("id", admin.companyId)
    .single<
      Pick<
        ContractorCompany,
        "line_channel_access_token" | "line_channel_secret"
      >
    >();

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

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

      <section className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Mini App URL（LINEで開く画面）
        </h2>
        <p className="max-w-lg text-sm text-zinc-500">
          清掃者・オーナーが LINE で開くスケジュール画面の URL です。
          通知メッセージやリッチメニューでの案内に使えます。
        </p>
        {liffId ? (
          <ul className="max-w-xl space-y-2">
            {[
              { label: "オーナー", path: "owner" },
              { label: "清掃者", path: "cleaner" },
            ].map(({ label, path }) => {
              const url = `https://liff.line.me/${liffId}/${path}/schedules`;
              return (
                <li
                  key={path}
                  className="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span className="w-14 shrink-0 text-zinc-500">{label}</span>
                  <code className="flex-1 truncate text-zinc-800 dark:text-zinc-200">
                    {url}
                  </code>
                  <CopyButton text={url} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            LIFF ID（NEXT_PUBLIC_LIFF_ID）が未設定のため URL を表示できません。
          </p>
        )}
      </section>
    </div>
  );
}
