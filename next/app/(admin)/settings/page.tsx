import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { Contractor } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  // 機密列（トークン/シークレット）は service_role でのみ参照可。存在有無だけ取得する。
  const supabase = createAdminClient();

  const { data: contractor } = await supabase
    .from("contractors")
    .select("line_channel_access_token, line_channel_secret")
    .eq("id", admin.contractorId)
    .single<
      Pick<
        Contractor,
        "line_channel_access_token" | "line_channel_secret"
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
        tokenSet={!!contractor?.line_channel_access_token}
        secretSet={!!contractor?.line_channel_secret}
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
