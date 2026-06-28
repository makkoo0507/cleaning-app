"use client";

import { useActionState } from "react";
import { reportToOwner, type ReportFormState } from "../actions";

interface Props {
  jobId: string;
  propertyName: string;
  memo: string | null;
  reportedAt: string | null;
}

function formatReportedAt(iso: string): string {
  const jst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}/${String(jst.getUTCMonth() + 1).padStart(2, "0")}/${String(jst.getUTCDate()).padStart(2, "0")} ${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

export default function ReportSection({ jobId, propertyName, memo, reportedAt }: Props) {
  const [state, formAction, pending] = useActionState<ReportFormState, FormData>(
    reportToOwner.bind(null, jobId),
    {}
  );

  const previewText = [
    `${propertyName}の清掃が完了しました。`,
    memo || null,
    "写真を見る:\nhttps://liff.line.me/…/owner/jobs/…",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-medium text-zinc-500">
          送信内容プレビュー（オーナーのLINEに届くメッセージ）
        </p>
        <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
          {previewText}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "送信中…" : "オーナーに報告"}
          </button>
        </form>

        {reportedAt && !state.success && (
          <span className="text-xs text-zinc-500">
            報告済み: {formatReportedAt(reportedAt)}
          </span>
        )}
        {state.success && (
          <span className="text-sm text-green-600">LINEを送信しました。</span>
        )}
        {state.error && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}
      </div>
    </div>
  );
}
