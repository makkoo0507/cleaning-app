"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLiffUser } from "@/app/liff/_components/LiffAuthGuard";
import { formatDateShort, formatTime } from "@/lib/format";
import type { Job, Property } from "@/lib/database.types";

type JobRow = Job & { properties: Pick<Property, "name" | "address"> };

export default function CleanerSchedulesPage() {
  const user = useLiffUser();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("jobs")
      .select("*, properties(name, address)")
      .eq("cleaner_id", user.id)
      .order("scheduled_date", { ascending: false })
      .then(({ data }) => {
        setJobs((data as JobRow[]) ?? []);
        setLoading(false);
      });
  }, [user.id]);

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          マイスケジュール
        </h1>
        <span className="text-sm text-zinc-500">{user.name}</span>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">読み込み中...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-zinc-500">担当案件はありません。</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/liff/cleaner/jobs/${job.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {job.properties.name}
                  </span>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {formatDateShort(job.scheduled_date)}{" "}
                  {formatTime(job.scheduled_start_time)}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-400">
                  {job.properties.address}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
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
