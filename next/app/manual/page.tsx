import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "マニュアル一覧｜民泊清掃管理",
};

const MANUALS = [
  {
    href: "/manual/line-setup",
    title: "LINE連携 設定マニュアル",
    desc: "公式アカウント作成〜トークン登録まで。通知を使うための初期設定。",
  },
  {
    href: "/manual/invite",
    title: "招待URLの発行マニュアル",
    desc: "清掃者・オーナーを登録し、LINE と紐付けるための招待URLの発行・送付手順。",
  },
  {
    href: "/manual/rich-menu",
    title: "リッチメニュー設定マニュアル（任意）",
    desc: "公式アカウントのメニューにスケジュール画面を開くボタンを設置する手順。",
  },
];

export default function ManualIndexPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm text-zinc-500">民泊清掃管理</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          マニュアル一覧
        </h1>
      </header>

      <ul className="space-y-3">
        {MANUALS.map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {m.title}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{m.desc}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard"
        className="mt-8 inline-block text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        ← 管理画面に戻る
      </Link>
    </div>
  );
}
