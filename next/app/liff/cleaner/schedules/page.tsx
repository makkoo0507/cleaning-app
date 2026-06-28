import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import { jstDateRanges, formatTime } from "@/lib/format";
import type { Job, Property } from "@/lib/database.types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  scheduled:   "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed:   "bg-green-100 text-green-700",
};
const STATUS_DOT: Record<string, string> = {
  scheduled:   "bg-blue-500",
  in_progress: "bg-amber-500",
  completed:   "bg-green-500",
};
const STATUS_LABEL: Record<string, string> = {
  scheduled:   "予定",
  in_progress: "作業中",
  completed:   "完了",
};

type JobRow = Job & { properties: Pick<Property, "name" | "address"> };

export default async function CleanerSchedulesPage() {
  const user = await getLiffUser();
  if (!user || user.role !== "cleaner") {
    return <LiffBootstrap liffId={LIFF_ID} expectedRole="cleaner" />;
  }

  const { today } = jstDateRanges();
  const addDays = (ymd: string, days: number) => {
    const d = new Date(ymd + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const dateFrom = addDays(today, -7);
  const dateTo   = addDays(today, 90);

  const admin = createAdminClient();
  const { data } = await admin
    .from("jobs")
    .select("*, properties(name, address)")
    .eq("cleaner_id", user.id)
    .gte("scheduled_date", dateFrom)
    .lte("scheduled_date", dateTo)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_start_time", { ascending: true });
  const jobs = (data as JobRow[]) ?? [];

  // 日付でグループ化
  const grouped = new Map<string, JobRow[]>();
  for (const job of jobs) {
    const arr = grouped.get(job.scheduled_date) ?? [];
    arr.push(job);
    grouped.set(job.scheduled_date, arr);
  }
  const dates = Array.from(grouped.keys());

  const DOW = ["日", "月", "火", "水", "木", "金", "土"];
  function dateLabel(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    const dow = DOW[new Date(y, m - 1, d).getDay()];
    return `${m}/${d}（${dow}）`;
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">マイスケジュール</h1>
        <span className="text-sm text-zinc-500">{user.name}</span>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-zinc-500">担当案件はありません。</p>
      ) : (
        <div className="space-y-1">
          {dates.map((ymd) => {
            const dayJobs = grouped.get(ymd) ?? [];
            return (
              <div key={ymd} className="flex gap-3">
                <div className="w-16 flex-shrink-0 pt-3 text-right text-sm text-zinc-500">
                  {dateLabel(ymd)}
                </div>
                <div className="flex-1 space-y-1 border-l-2 border-zinc-200 pl-3 pt-3 dark:border-zinc-700">
                  {dayJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/liff/cleaner/jobs/${job.id}`}
                      className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[job.status]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {job.properties.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatTime(job.scheduled_start_time) === "—" ? "時刻未定" : formatTime(job.scheduled_start_time)}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] ${STATUS_CHIP[job.status]}`}>
                        {STATUS_LABEL[job.status]}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
