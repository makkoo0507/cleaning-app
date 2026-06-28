"use client";

// 清掃開始・完了・メモ更新（更新は /api/liff/record 経由）。成功後 router.refresh で再取得。
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/lib/database.types";

export default function CleanerJobActions({
  jobId,
  status,
  initialMemo,
}: {
  jobId: string;
  status: JobStatus;
  initialMemo?: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function send(action: "start" | "complete" | "update_memo" | "revert_start" | "revert_complete") {
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/liff/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, jobId, memo }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        already_started: "既に開始されています。",
        not_in_progress: "清掃が開始されていません。",
        forbidden: "この案件へのアクセス権限がありません。",
        record_not_found: "記録が見つかりません。",
      };
      setError(messages[json.error] ?? "操作に失敗しました。");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    if (action === "update_memo") {
      setSaved(true);
    }
    router.refresh();
  }

  const memoField = (
    <textarea
      value={memo}
      onChange={(e) => setMemo(e.target.value)}
      placeholder="共有（任意）"
      rows={3}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
    />
  );

  return (
    <div className="mt-4 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {status === "scheduled" && (
        <button
          onClick={() => send("start")}
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "処理中..." : "清掃開始"}
        </button>
      )}

      {status === "in_progress" && (
        <>
          {memoField}
          <button
            onClick={() => send("complete")}
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "処理中..." : "清掃完了"}
          </button>
          <button
            onClick={() => send("revert_start")}
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 py-2 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            開始を取り消す
          </button>
        </>
      )}

      {status === "completed" && (
        <>
          <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            清掃完了済み
          </div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            共有（完了後も編集できます）
          </label>
          {memoField}
          <button
            onClick={() => send("update_memo")}
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {submitting ? "保存中..." : "共有を保存"}
          </button>
          {saved && (
            <p className="text-center text-xs text-green-600">保存しました</p>
          )}
          <button
            onClick={() => send("revert_complete")}
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 py-2 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            完了を取り消す
          </button>
        </>
      )}
    </div>
  );
}
