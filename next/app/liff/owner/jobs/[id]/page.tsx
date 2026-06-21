"use client";

import { useEffect, useState } from "react";
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

export default function OwnerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useLiffUser();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [record, setRecord] = useState<CleaningRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      // アクセス権確認: 自分が関係者として登録されている物件の案件か
      const { data: jobData } = await supabase
        .from("jobs")
        .select("*, properties(name, address, notes)")
        .eq("id", id)
        .single();

      if (!jobData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // property_members で自分が関係者か確認
      const { data: member } = await supabase
        .from("property_members")
        .select("user_id")
        .eq("property_id", jobData.property_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: recordData } = await supabase
        .from("cleaning_records")
        .select("*")
        .eq("job_id", id)
        .maybeSingle();

      setJob(jobData as JobDetail);
      setRecord((recordData as CleaningRecord) ?? null);
      setLoading(false);
    }

    fetchData();
  }, [id, user.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-red-600">案件が見つかりません。</p>
        <Link
          href="/liff/owner/schedules"
          className="mt-4 inline-block text-sm text-zinc-500 underline"
        >
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <Link
        href="/liff/owner/schedules"
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">清掃予定日時</p>
            <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
              {formatDateShort(job.scheduled_date)}{" "}
              {formatTime(job.scheduled_start_time)}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* 清掃記録（完了後のみ） */}
      {record?.completed_at ? (
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
      ) : job.status !== "scheduled" ? (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          清掃中です。完了後に記録が表示されます。
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    scheduled: "予定",
    in_progress: "作業中",
    completed: "完了",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.scheduled}`}
    >
      {labels[status] ?? "予定"}
    </span>
  );
}
