import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "招待URLの発行マニュアル｜民泊清掃管理",
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

export default function InviteManualPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <a href="/manual" className="mb-6 inline-block text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
        ← マニュアル一覧に戻る
      </a>
      <header className="mb-8">
        <p className="text-sm text-zinc-500">民泊清掃管理</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          招待URLの発行マニュアル
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          清掃者・オーナーを本システムに登録し、LINE と紐付けるための「招待URL」を発行・送付する手順です。
          相手が招待URLを開いて LINE ログインすると、紐付けが完了します。
        </p>
      </header>

      <div className="space-y-6">
        <Step no={1} title="管理画面にログインする">
          <p>
            管理者・社員のアカウントで管理画面にログインします
            （会社ごとのログインURL: <code>/&#123;会社ID&#125;/login</code>）。
          </p>
        </Step>

        <Step no={2} title="清掃者またはオーナーを登録する">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              清掃者を招待する場合は<strong>「清掃者管理」</strong>、
              オーナー・物件関係者を招待する場合は<strong>「オーナー管理」</strong>を開く
            </li>
            <li>
              <strong>「+ 清掃者を登録」/「+ 関係者を登録」</strong>から、名前などを入力して保存
            </li>
          </ul>
          <p className="text-zinc-500">
            ※ 登録した時点では、その人はまだ LINE と紐付いていません（招待URLの送付が必要）。
          </p>
        </Step>

        <Step no={3} title="招待URLをコピーする">
          <p>
            一覧画面の対象者の行にある<strong>「招待URLをコピー」</strong>を押します。
            その人専用の招待URLがクリップボードにコピーされます。
          </p>
          <p className="text-zinc-500">
            ※「紐付け済み」と表示されている人は、すでに LINE 連携が完了しているため招待URLは出ません。
          </p>
        </Step>

        <Step no={4} title="相手に招待URLを送る">
          <p>
            コピーした招待URLを、<strong>LINE や SMS、メール</strong>などで本人に送ります。
            公式アカウントの友だち追加もまだの場合は、友だち追加用のQRコード／URLも一緒に案内すると親切です。
          </p>
        </Step>

        <Step no={5} title="相手が紐付けを完了する">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              本人が招待URLを<strong>LINE アプリで開く</strong>
            </li>
            <li>LINE でログイン（初回のみ許可）</li>
            <li>「連携が完了しました」と表示されれば紐付け完了</li>
          </ul>
          <p className="text-zinc-500">
            ※ 紐付けが完了すると、その招待URLは使えなくなります（1回限り）。
            管理画面の一覧では「紐付け済み」と表示されます。
          </p>
        </Step>
      </div>

      <section className="mt-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-medium">補足</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            通知を受け取るには、招待URLでの紐付けに加えて、公式アカウントの
            友だち追加が必要です。
          </li>
          <li>
            招待URLは <code>https://liff.line.me/...</code> 形式で、LINE アプリ内で開く前提です。
          </li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        民泊清掃管理 — 招待URLの発行マニュアル
      </footer>
    </div>
  );
}
