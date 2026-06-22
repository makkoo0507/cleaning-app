import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";

export const metadata: Metadata = {
  title: "リッチメニュー設定マニュアル｜民泊清掃管理",
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

function UrlRow({ label, url }: { label: string; url: string }) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
      <span className="w-28 shrink-0 text-zinc-500">{label}</span>
      <code className="flex-1 truncate text-zinc-800 dark:text-zinc-200">
        {url}
      </code>
      <CopyButton text={url} />
    </li>
  );
}

export default function RichMenuManualPage() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const autoUrl = liffId ? `https://liff.line.me/${liffId}` : "";
  const ownerUrl = liffId
    ? `https://liff.line.me/${liffId}/owner/schedules`
    : "";
  const cleanerUrl = liffId
    ? `https://liff.line.me/${liffId}/cleaner/schedules`
    : "";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <a href="/manual" className="mb-6 inline-block text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
        ← マニュアル一覧に戻る
      </a>
      <header className="mb-8">
        <p className="text-sm text-zinc-500">民泊清掃管理</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          リッチメニュー設定マニュアル（任意）
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          公式アカウントのトーク画面の下に表示される「リッチメニュー」に、
          スケジュール画面を開くボタンを置く設定です。設定しておくと、清掃者・オーナーが
          毎回メッセージのリンクを探さずワンタップで開けます。
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          設定で使う URL
        </h2>
        <p className="mt-1 mb-3 text-sm text-zinc-500">
          リッチメニューのボタンに貼り付ける URL です。
        </p>
        {liffId ? (
          <ul className="space-y-2">
            <UrlRow label="おすすめ（自動振り分け）" url={autoUrl} />
            <UrlRow label="オーナー専用" url={ownerUrl} />
            <UrlRow label="清掃者専用" url={cleanerUrl} />
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            LIFF ID（NEXT_PUBLIC_LIFF_ID）が未設定のため URL を表示できません。
          </p>
        )}
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          公式アカウントは清掃者・オーナーの両方が友だち追加します。
          <strong>「おすすめ（自動振り分け）」の URL を1つのボタンに設定</strong>すれば、
          開いた人の役割に応じて自動的に正しい画面（清掃者用／オーナー用）が表示されます。
          役割ごとにボタンを分けたい場合は専用 URL を使ってください。
        </p>
      </section>

      <div className="space-y-6">
        <Step no={1} title="リッチメニュー作成画面を開く">
          <p>
            <a
              href="https://manager.line.biz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              LINE Official Account Manager
            </a>
            で対象の公式アカウントを開き、
            <strong>「ホーム」→「リッチメニュー」→「作成」</strong>を選びます。
          </p>
        </Step>

        <Step no={2} title="表示設定とデザインを選ぶ">
          <ul className="list-disc space-y-1 pl-5">
            <li>タイトル（管理用の名前）と表示期間を設定</li>
            <li>
              <strong>テンプレート</strong>を選ぶ（ボタンを1つにするなら大きな1枠の
              テンプレートが分かりやすい）
            </li>
            <li>背景画像やボタンの文字（例：「スケジュールを開く」）を設定</li>
          </ul>
        </Step>

        <Step no={3} title="ボタンのアクションに URL を設定する">
          <ul className="list-disc space-y-1 pl-5">
            <li>各ボタン領域のアクションで<strong>「リンク」</strong>を選ぶ</li>
            <li>
              上の「設定で使う URL」からコピーした URL を貼り付ける
              （おすすめは「自動振り分け」の URL）
            </li>
          </ul>
        </Step>

        <Step no={4} title="保存して公開する">
          <p>
            内容を確認して<strong>「保存」</strong>します。公開されると、
            友だち追加済みのユーザーのトーク画面下部にメニューが表示されます。
          </p>
        </Step>
      </div>

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        民泊清掃管理 — リッチメニュー設定マニュアル
      </footer>
    </div>
  );
}
