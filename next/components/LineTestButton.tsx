"use client";

import { useState, useTransition } from "react";
import { sendTestNotification } from "@/app/(admin)/actions";

// 紐付け済みユーザーへテスト通知を送るボタン（清掃者/オーナー編集画面で使用）
export default function LineTestButton({ userId }: { userId: string }) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});
  const [pending, start] = useTransition();

  function run() {
    start(async () => setState(await sendTestNotification(userId)));
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {pending ? "送信中…" : "テスト通知を送る"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-green-600">
          テスト通知を送信しました。相手の LINE をご確認ください。
        </p>
      )}
    </div>
  );
}
