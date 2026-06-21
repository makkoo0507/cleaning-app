"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLiffUser } from "@/app/liff/_components/LiffAuthGuard";
import {
  formatDateShort,
  formatTime,
  formatDateTime,
  formatDuration,
} from "@/lib/format";
import type { CleaningRecord, Job, Property } from "@/lib/database.types";

type JobDetail = Job & {
  properties: Pick<Property, "name" | "address" | "notes">;
};

export default function CleanerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useLiffUser();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [record, setRecord] = useState<CleaningRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [jobRes, recordRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("*, properties(name, address, notes)")
        .eq("id", id)
        .eq("cleaner_id", user.id)
        .single(),
      supabase
        .from("cleaning_records")
        .select("*")
        .eq("job_id", id)
        .maybeSingle(),
    ]);

    setJob((jobRes.data as JobDetail) ?? null);
    setRecord((recordRes.data as CleaningRecord) ?? null);
    setLoading(false);
  }, [id, user.id]);

  useEffect(() => {
    // setState は await（データ取得）後に行うため同期的な連鎖描画は起きない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  async function handleAction(action: "start" | "complete") {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/liff/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, jobId: id, memo }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        already_started: "既に開始されています。",
        not_in_progress: "清掃が開始されていません。",
        forbidden: "この案件へのアクセス権限がありません。",
      };
      setError(messages[json.error] ?? "操作に失敗しました。");
    } else {
      await fetchData();
      setMemo("");
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-red-600">案件が見つかりません。</p>
        <Link
          href="/liff/cleaner/schedules"
          className="mt-4 inline-block text-sm text-zinc-500 underline"
        >
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const isScheduled = job.status === "scheduled";
  const isInProgress = job.status === "in_progress";
  const isCompleted = job.status === "completed";

  return (
    <div className="px-4 py-6">
      <Link
        href="/liff/cleaner/schedules"
        className="mb-4 inline-block text-sm text-zinc-500"
      >
        ← 一覧に戻る
      </Link>

      {/* 物件情報 */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {job.properties.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {job.properties.address}
        </p>
        {job.properties.notes && (
          <p className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {job.properties.notes}
          </p>
        )}
      </div>

      {/* スケジュール */}
      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">清掃予定日時</p>
        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
          {formatDateShort(job.scheduled_date)}{" "}
          {formatTime(job.scheduled_start_time)}
        </p>
      </div>

      {/* 清掃記録 */}
      {record && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            清掃記録
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">開始</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {formatDateTime(record.started_at)}
              </dd>
            </div>
            {record.completed_at && (
              <>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">完了</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">
                    {formatDateTime(record.completed_at)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">所要時間</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">
                    {formatDuration(record.duration_minutes)}
                  </dd>
                </div>
              </>
            )}
            {record.memo && (
              <div className="pt-1">
                <dt className="text-zinc-500">メモ</dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {record.memo}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* アクション */}
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {isScheduled && (
        <button
          onClick={() => handleAction("start")}
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "処理中..." : "清掃開始"}
        </button>
      )}

      {isInProgress && (
        <div className="mt-4 space-y-3">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            onClick={() => handleAction("complete")}
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "処理中..." : "清掃完了"}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
          清掃完了済み
        </div>
      )}
    </div>
  );
}
