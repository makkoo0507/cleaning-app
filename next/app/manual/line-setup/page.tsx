import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LINE連携 設定マニュアル｜民泊清掃管理",
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

export default function LineSetupManualPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm text-zinc-500">民泊清掃管理</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          LINE連携 設定マニュアル
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          自社の LINE 公式アカウントから清掃者・オーナーへ通知を送るための初期設定手順です。
          設定は一度だけ行います。
        </p>
      </header>

      <section className="mb-6 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">前提：LINE Developers アカウント</p>
        <p className="mt-1 leading-7">
          Messaging API の有効化（手順2）では「プロバイダー」の指定が必要で、これは
          LINE Developers のアカウント配下に作られます。初回のみ
          <a
            href="https://developers.line.biz/console/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            LINE Developers Console
          </a>
          に LINE Business ID（公式アカウントと同じログイン）でサインインし、
          開発者名・メールの登録と契約同意を済ませてください（新しい ID 作成は通常不要）。
        </p>
      </section>

      <div className="space-y-6">
        <Step no={1} title="LINE公式アカウントを作成する">
          <p>
            <a
              href="https://manager.line.biz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              LINE Official Account Manager
            </a>
            （manager.line.biz）で LINE 公式アカウントを開設します（既にお持ちの場合は不要）。
            これが清掃者・オーナーへ通知を送る「送信元」になります。
          </p>
        </Step>

        <Step no={2} title="その公式アカウントで Messaging API を有効化する">
          <p>
            Messaging API は公式アカウントに対して有効化して使います。
            LINE Official Account Manager で対象アカウントを開き、
            <strong>
              「設定」→「Messaging API」→「Messaging API を利用する」
            </strong>
            を選択。プロバイダーを指定すると、
            <a
              href="https://developers.line.biz/console/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              LINE Developers Console
            </a>
            側に対応する <strong>Messaging API チャネル</strong>が作成されます。
          </p>
          <p className="text-zinc-500">
            ※ 以降のトークン／シークレットの取得は、この Messaging API チャネルを
            LINE Developers Console で開いて行います。ログイン用の「LINE Login」
            チャネルとは別物です。
          </p>
        </Step>

        <Step no={3} title="チャネルアクセストークン（長期）を発行する">
          <ul className="list-disc space-y-1 pl-5">
            <li>作成した Messaging API チャネルを開く</li>
            <li>
              <strong>「Messaging API設定」</strong>タブを開く
            </li>
            <li>
              「チャネルアクセストークン（長期）」の<strong>「発行」</strong>
              ボタンを押し、表示された文字列をコピー
            </li>
          </ul>
        </Step>

        <Step no={4} title="チャネルシークレットを確認する">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              同じチャネルの<strong>「チャネル基本設定」</strong>タブを開く
            </li>
            <li>「チャネルシークレット」の値をコピー</li>
          </ul>
        </Step>

        <Step no={5} title="本システムに登録する">
          <p>
            管理画面の<strong>「設定（LINE連携）」</strong>を開き、上でコピーした
            <strong>チャネルアクセストークン</strong>と
            <strong>チャネルシークレット</strong>を貼り付けて「保存」します。
          </p>
          <p className="text-zinc-500">
            ※ 保存後はセキュリティのため値はマスク表示され、再表示されません。変更時は再入力してください。
          </p>
        </Step>

        <Step no={6} title="清掃者・オーナーに友だち追加してもらう">
          <p>
            通知（プッシュメッセージ）は、<strong>公式アカウントを友だち追加した相手にのみ</strong>
            届きます。清掃者・オーナーには、招待 URL の案内とあわせて、自社公式アカウントの
            友だち追加 URL／QR コードを共有してください。
          </p>
        </Step>
      </div>

      <section className="mt-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-medium">通知が届かないときのチェック</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>チャネルアクセストークン／シークレットが正しく保存されているか</li>
          <li>受信者が公式アカウントを友だち追加しているか</li>
          <li>受信者の LINE アカウントが本システムに紐付け済みか（招待 URL から登録）</li>
        </ul>
      </section>

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        民泊清掃管理 — LINE連携 設定マニュアル
      </footer>
    </div>
  );
}
