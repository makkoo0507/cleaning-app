import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "パスワードの再設定マニュアル｜民泊清掃管理",
};

export default function PasswordManualPage() {
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
          パスワードの再設定マニュアル
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          パスワードを忘れた場合は、管理者が再設定できます。
        </p>
      </header>

      <section className="space-y-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          管理者による再設定の手順
        </h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>管理者でログインし、「ユーザー管理」を開く。</li>
          <li>パスワードを変更したいユーザーの「編集」を開く。</li>
          <li>パスワード欄に新しいパスワード（8文字以上）を入力して保存する。</li>
          <li>新しいパスワードを本人へ安全な方法で伝える。</li>
        </ol>
        <p className="text-zinc-500">
          ※ パスワード欄を空のまま保存した場合、パスワードは変更されません。
        </p>
      </section>

      <section className="mt-8 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">補足</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>清掃者・オーナーは LINE で利用するため、パスワードはありません。</li>
          <li>
            管理者自身が全員ログインできなくなった場合は、システム運営（ベンダー）まで
            お問い合わせください。
          </li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        民泊清掃管理 — パスワードの再設定マニュアル
      </footer>
    </div>
  );
}
