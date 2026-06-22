"use client";

import { useState, useTransition } from "react";
import { verifyToken, type VerifyTokenState } from "./actions";

export default function TokenCheck() {
  const [state, setState] = useState<VerifyTokenState>({});
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      setState(await verifyToken());
    });
  }

  return (
    <div className="max-w-lg space-y-3">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {pending ? "確認中…" : "接続テスト（トークン確認）"}
      </button>

      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <p>{state.error}</p>
          {state.secretSet === false && (
            <p className="mt-1 text-xs">
              ※ チャネルシークレットも未登録です。
            </p>
          )}
        </div>
      )}

      {state.success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <p>
            トークンは有効です
            {state.accountName ? `（公式アカウント: ${state.accountName}）` : ""}
            。
          </p>
          <p className="mt-1 text-xs">
            チャネルシークレット: {state.secretSet ? "設定済み" : "未設定"}
            {!state.secretSet &&
              "（Webhook 署名検証に使用。通知送信のみなら未設定でも可）"}
          </p>
        </div>
      )}
    </div>
  );
}
