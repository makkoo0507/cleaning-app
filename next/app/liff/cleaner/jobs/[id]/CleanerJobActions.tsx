"use client";

// 清掃開始・完了の操作（更新は /api/liff/record 経由）。成功後に router.refresh で再取得。
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/lib/database.types";

export default function CleanerJobActions({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handle(action: "start" | "complete") {
    setSubmitting(true);
    setError(null);

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
      };
      setError(messages[json.error] ?? "操作に失敗しました。");
      setSubmitting(false);
      return;
    }

    setMemo("");
    setSubmitting(false);
    router.refresh();
  }

  if (status === "completed") {
    return (
      <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        清掃完了済み
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {status === "scheduled" && (
        <button
          onClick={() => handle("start")}
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "処理中..." : "清掃開始"}
        </button>
      )}

      {status === "in_progress" && (
        <>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            onClick={() => handle("complete")}
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "処理中..." : "清掃完了"}
          </button>
        </>
      )}
    </div>
  );
}
