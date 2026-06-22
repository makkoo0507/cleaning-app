import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "定期リマインド設定マニュアル｜民泊清掃管理",
};

function Step({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900">
          {no}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

export default function ReminderManualPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <a
        href="/manual"
        className="mb-6 inline-block text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        ← マニュアル一覧に戻る
      </a>
      <header className="mb-8">
        <p className="text-sm text-zinc-500">民泊清掃管理</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          定期リマインド設定マニュアル
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          清掃予定を LINE で自動リマインドする機能です。送信先（清掃者／オーナー）と
          タイミング（前日／当日）は管理画面の「設定（LINE連携）」で選べます。
          自動送信を動かすには、初回のみ下記のスケジュール登録が必要です。
        </p>
      </header>

      <section className="mb-6 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">仕組み</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>前日リマインド: 翌日に予定がある案件を、前日の夜に送信</li>
          <li>当日リマインド: 当日に予定がある案件を、当日の朝に送信</li>
          <li>送信先・タイミングは会社ごとの設定に従う（オフなら送信しない）</li>
          <li>同じ案件・同じ種別は一度だけ送信（重複送信なし）</li>
        </ul>
      </section>

      <div className="space-y-6">
        <Step no={1} title="送信先とタイミングを設定する">
          <p>
            管理画面の<strong>「設定（LINE連携）」→「定期リマインド設定」</strong>で、
            送信先（清掃者／オーナー）とタイミング（前日／当日）のチェックを選んで保存します。
          </p>
        </Step>

        <Step no={2} title="拡張機能を有効化する（初回のみ・本番）">
          <p>
            Supabase ダッシュボードの <strong>Database → Extensions</strong> で
            <strong>pg_cron</strong> と <strong>pg_net</strong> を有効化します。
          </p>
        </Step>

        <Step no={3} title="接続情報を設定する（初回のみ・本番）">
          <p>SQL Editor で以下を実行します（値はプロジェクトのものに置換）。</p>
          <pre className="overflow-x-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">{`ALTER DATABASE postgres
  SET app.supabase_functions_url TO 'https://<project-ref>.supabase.co/functions/v1';
ALTER DATABASE postgres
  SET app.service_role_key TO '<service_role_key>';`}</pre>
        </Step>

        <Step no={4} title="スケジュールを登録する（初回のみ・本番）">
          <p>
            前日（20:00 JST）と当日（8:00 JST）の2本を登録します。SQL Editor で実行:
          </p>
          <pre className="overflow-x-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-800">{`SELECT cron.schedule('reminder-prev-day', '0 11 * * *', $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_functions_url') || '/daily-reminder',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                 'Content-Type',  'application/json'),
    body    := '{"kind":"prev_day"}'::jsonb); $$);

SELECT cron.schedule('reminder-same-day', '0 23 * * *', $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_functions_url') || '/daily-reminder',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                 'Content-Type',  'application/json'),
    body    := '{"kind":"same_day"}'::jsonb); $$);`}</pre>
          <p className="text-zinc-500">
            ※ Edge Function `daily-reminder` を事前にデプロイしておく必要があります
            （`supabase functions deploy daily-reminder`）。
          </p>
        </Step>
      </div>

      <section className="mt-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-medium">届かないときのチェック</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>設定で送信先・タイミングがオンになっているか</li>
          <li>チャネルアクセストークンが登録され、受信者が公式アカウントを友だち追加しているか</li>
          <li>cron の時刻は UTC 指定（20:00 JST = 11:00 UTC、8:00 JST = 23:00 UTC）</li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        民泊清掃管理 — 定期リマインド設定マニュアル
      </footer>
    </div>
  );
}
