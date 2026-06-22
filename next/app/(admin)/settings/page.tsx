import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContractorCompany, User } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import SettingsForm from "./SettingsForm";
import TestSend from "./TestSend";

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

  // LINE 紐付け済みユーザー（テスト送信先）
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, role")
    .not("line_user_id", "is", null)
    .order("role");
  const recipients = (usersData as Pick<User, "id" | "name" | "role">[]) ?? [];

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
        className="inline-flex max-w-lg items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        📄 設定マニュアルを開く（別タブ）
      </a>
      <SettingsForm
        tokenSet={!!company?.line_channel_access_token}
        secretSet={!!company?.line_channel_secret}
      />

      <section className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          テスト送信
        </h2>
        <p className="max-w-lg text-sm text-zinc-500">
          登録したトークンで、選んだユーザーへ実際に LINE メッセージを送って動作確認します。
          受信には、送信先が自社の公式アカウントを友だち追加している必要があります。
        </p>
        <TestSend recipients={recipients} />
      </section>
    </div>
  );
}
