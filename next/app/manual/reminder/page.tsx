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
          タイミング（前日／当日）を管理画面の「設定 &gt; 定期送信」で選べます。
        </p>
      </header>

      <section className="mb-6 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">仕組み</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>前日リマインド: 翌日に予定がある案件を、前日の <strong>20:00 頃</strong>（日本時間）に送信</li>
          <li>当日リマインド: 当日に予定がある案件を、当日の <strong>朝 8:00 頃</strong>（日本時間）に送信</li>
          <li>送信先・タイミングは会社ごとの設定に従う（オフなら送信しない）</li>
          <li>同じ案件・同じ種別は一度だけ送信（重複送信なし）</li>
        </ul>
      </section>

      <div className="space-y-6">
        <Step no={1} title="送信先とタイミングを設定する">
          <p>
            管理画面の<strong>「設定 &gt; 定期送信」</strong>を開き、
            送信先（清掃者／オーナー）とタイミング（前日／当日）のチェックを選んで保存します。
          </p>
          <p className="text-zinc-500">
            例: 「清掃者は前日と当日」「オーナーは当日のみ」のように、
            送信先ごとに別々のタイミングを設定できます。
          </p>
        </Step>
      </div>

      <section className="mt-8 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          自動送信の有効化について
        </p>
        <p className="mt-1">
          実際に自動送信を動かすための初期設定（サーバー側の定期実行の登録）は、
          システム運営側で行います。設定したのにリマインドが届かない場合は、
          運営までお問い合わせください。
        </p>
      </section>

      <section className="mt-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-medium">届かないときのチェック</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>設定で送信先・タイミングがオンになっているか</li>
          <li>チャネルアクセストークンが登録され、受信者が公式アカウントを友だち追加しているか</li>
          <li>清掃者・オーナーがLINE連携（紐付け）済みか</li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        民泊清掃管理 — 定期リマインド設定マニュアル
      </footer>
    </div>
  );
}
