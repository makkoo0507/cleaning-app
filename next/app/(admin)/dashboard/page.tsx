import Link from "next/link";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Job, Property } from "@/lib/database.types";
import { JOB_STATUS_LABEL } from "@/lib/database.types";
import { jstDateRanges, formatTime } from "@/lib/format";
import { Badge, Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireContractor();
  const supabase = await createClient();
  const { today, weekStart, weekEnd } = jstDateRanges();

  const [{ data: todayJobs }, { data: weekJobs }, { data: properties }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .eq("scheduled_date", today)
        .order("scheduled_start_time", { ascending: true }),
      supabase
        .from("jobs")
        .select("*")
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd),
      supabase.from("properties").select("id, name"),
    ]);

  const propMap = new Map(
    ((properties as Pick<Property, "id" | "name">[]) ?? []).map((p) => [
      p.id,
      p.name,
    ])
  );
  const todayList = (todayJobs as Job[]) ?? [];
  const weekList = (weekJobs as Job[]) ?? [];

  const weekCompleted = weekList.filter((j) => j.status === "completed").length;
  const weekUnassigned = weekList.filter((j) => !j.cleaner_id).length;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        ダッシュボード
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="本日の案件" value={todayList.length} />
        <Card label="今週の案件" value={weekList.length} />
        <Card label="今週の完了" value={weekCompleted} />
        <Card label="未アサイン（今週）" value={weekUnassigned} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          本日の案件
        </h2>
        {todayList.length === 0 ? (
          <EmptyState>本日の案件はありません。</EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {todayList.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <Link
                  href={`/schedules/${job.id}`}
                  className="flex-1 hover:underline"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {propMap.get(job.property_id) ?? "（不明な物件）"}
                  </span>
                  <span className="ml-2 text-zinc-500">
                    {formatTime(job.scheduled_start_time) === "—"
                      ? "時刻未定"
                      : formatTime(job.scheduled_start_time)}
                  </span>
                </Link>
                <Badge>{JOB_STATUS_LABEL[job.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/schedules"
        className="inline-block text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        スケジュール一覧へ →
      </Link>
    </div>
  );
}
