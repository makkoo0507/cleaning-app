import Link from "next/link";
import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Job, Property, User } from "@/lib/database.types";
import { jstDateRanges } from "@/lib/format";
import { WeekNav } from "./WeekNav";

export const dynamic = "force-dynamic";

const STATUS_CHIP: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: "予定",
  in_progress: "作業中",
  completed: "完了",
};
const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(ymd: string, days: number): string {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayLabel(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  const dow = DOW[parseYMD(ymd).getDay()];
  return `${m}月${d}日（${dow}）`;
}

function shortDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}`;
}

function gridLabel(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  const dow = DOW[parseYMD(ymd).getDay()];
  return `${m}/${d}（${dow}）`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const supabase = await createClient();
  const { today, weekStart, weekEnd } = jstDateRanges();
  const { week: weekParam } = await searchParams;
  const weekOffset = Number(weekParam ?? "0") * 7;

  // 月範囲
  const [year, month] = today.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = addDays(`${year}-${String(month + 1).padStart(2, "0")}-01`, -1);

  // 7日間範囲（週オフセット対応）
  const gridStart = addDays(today, weekOffset);
  const sevenDaysEnd = addDays(gridStart, 6);

  const [
    { data: todayData },
    { data: weekData },
    { data: monthData },
    { data: sevenDayData },
    { data: propsData },
    { data: cleanersData },
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("scheduled_date", today).order("scheduled_start_time", { ascending: true }),
    supabase.from("jobs").select("*").gte("scheduled_date", weekStart).lte("scheduled_date", weekEnd),
    supabase.from("jobs").select("*").gte("scheduled_date", monthStart).lte("scheduled_date", monthEnd),
    supabase.from("jobs").select("*").gte("scheduled_date", gridStart).lte("scheduled_date", sevenDaysEnd).order("scheduled_date").order("scheduled_start_time", { ascending: true }),
    supabase.from("properties").select("id, name"),
    supabase.from("users").select("id, name").eq("role", "cleaner"),
  ]);

  const propMap = new Map(((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [p.id, p.name]));
  const cleanerMap = new Map(((cleanersData as Pick<User, "id" | "name">[]) ?? []).map((c) => [c.id, c.name]));

  const todayJobs = (todayData as Job[]) ?? [];
  const weekJobs  = (weekData  as Job[]) ?? [];
  const monthJobs = (monthData as Job[]) ?? [];
  const sevenDayJobs = (sevenDayData as Job[]) ?? [];

  // KPI集計
  const count = (jobs: Job[], status?: string, unassigned?: boolean) =>
    jobs.filter((j) => {
      if (status && j.status !== status) return false;
      if (unassigned && j.cleaner_id) return false;
      return true;
    }).length;

  const kpi = {
    todayTotal:      todayJobs.length,
    todayCompleted:  count(todayJobs, "completed"),
    todayInProgress: count(todayJobs, "in_progress"),
    todayScheduled:  count(todayJobs, "scheduled"),
    todayUnassigned: count(todayJobs, "scheduled", true),
    weekTotal:       weekJobs.length,
    weekCompleted:   count(weekJobs, "completed"),
    weekInProgress:  count(weekJobs, "in_progress"),
    weekScheduled:   count(weekJobs, "scheduled"),
    weekUnassigned:  count(weekJobs, "scheduled", true),
    monthTotal:      monthJobs.length,
    monthCompleted:  count(monthJobs, "completed"),
    monthInProgress: count(monthJobs, "in_progress"),
    monthScheduled:  count(monthJobs, "scheduled"),
    monthUnassigned: count(monthJobs, "scheduled", true),
  };

  // 本日の案件テーブル用
  const todayTable = todayJobs.map((j) => ({
    id: j.id,
    time: j.scheduled_start_time ? j.scheduled_start_time.slice(0, 5) : null,
    property: propMap.get(j.property_id) ?? "不明",
    cleaner: j.cleaner_id ? (cleanerMap.get(j.cleaner_id) ?? null) : null,
    status: j.status,
  }));

  // 要対応：7日以内の未アサイン
  const alerts = sevenDayJobs
    .filter((j) => !j.cleaner_id && j.status === "scheduled")
    .map((j) => ({
      id: j.id,
      date: shortDate(j.scheduled_date),
      property: propMap.get(j.property_id) ?? "不明",
    }));

  // 7日間グリッド
  const sevenDays = Array.from({ length: 7 }, (_, i) => addDays(gridStart, i));
  const jobsByDate = new Map<string, Job[]>();
  for (const job of sevenDayJobs) {
    const arr = jobsByDate.get(job.scheduled_date) ?? [];
    arr.push(job);
    jobsByDate.set(job.scheduled_date, arr);
  }

  const barWidths = [1, 5, 20];
  const maxWidth = Math.max(...barWidths);
  const rows = [
    { label: "本日の案件", total: kpi.todayTotal, completed: kpi.todayCompleted, inProgress: kpi.todayInProgress, scheduled: kpi.todayScheduled, unassigned: kpi.todayUnassigned },
    { label: "今週の案件", total: kpi.weekTotal,  completed: kpi.weekCompleted,  inProgress: kpi.weekInProgress,  scheduled: kpi.weekScheduled,  unassigned: kpi.weekUnassigned  },
    { label: "今月の案件", total: kpi.monthTotal, completed: kpi.monthCompleted, inProgress: kpi.monthInProgress, scheduled: kpi.monthScheduled, unassigned: kpi.monthUnassigned },
  ];

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">ダッシュボード</h1>
          <p className="text-sm text-zinc-400">{todayLabel(today)}</p>
        </div>
        {admin && (
          <Link
            href="/schedules/new"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            + 案件を作成
          </Link>
        )}
      </div>

      {/* まとめカード */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={row.label} className={i > 0 ? "border-t border-zinc-100 pt-2 dark:border-zinc-800" : ""}>
              <div className="flex items-center gap-3">
                <p className="w-20 flex-shrink-0 text-xs font-medium text-zinc-500">{row.label}</p>
                <p className="w-8 flex-shrink-0 text-right text-lg font-bold text-zinc-900 dark:text-zinc-50">{row.total}</p>
                <div className="flex flex-1 flex-col gap-1">
                  {row.total > 0 ? (
                    <>
                      <div className="h-3 overflow-hidden rounded-full">
                        <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(barWidths[i] / maxWidth) * 100}%` }}>
                          <div className="bg-green-500" style={{ width: `${(row.completed / row.total) * 100}%` }} />
                          <div className="bg-amber-400" style={{ width: `${(row.inProgress / row.total) * 100}%` }} />
                          <div className="bg-blue-400" style={{ width: `${((row.scheduled - row.unassigned) / row.total) * 100}%` }} />
                          <div className="bg-red-400" style={{ width: `${(row.unassigned / row.total) * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />完 {row.completed}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />作中 {row.inProgress}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />予 {row.scheduled - row.unassigned}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-500"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />未アサ {row.unassigned}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-zinc-400">案件なし</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 本日の案件 + 要対応 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 本日の案件 */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">本日の案件</h2>
          {todayTable.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              本日の案件はありません
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">時刻</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">物件</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">担当者</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTable.map((job, i) => (
                    <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="px-3 py-2.5 text-right text-xs text-zinc-400">
                        {job.time !== todayTable[i - 1]?.time ? (job.time ?? "時刻未定") : ""}
                      </td>
                      <td className="border-t border-zinc-100 px-3 py-2.5 font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                        <Link href={`/schedules/${job.id}`} className="hover:underline">{job.property}</Link>
                      </td>
                      <td className="border-t border-zinc-100 px-3 py-2.5 text-xs text-zinc-500 dark:border-zinc-800">
                        {job.cleaner ?? <span className="text-red-500">未アサイン</span>}
                      </td>
                      <td className="border-t border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CHIP[job.status]}`}>
                          {STATUS_LABEL[job.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 要対応 */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            要対応（7日以内）
            <span className="text-xs font-normal text-red-500">＊未アサイン</span>
          </h2>
          {alerts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              未アサインの案件はありません
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 text-xs text-zinc-400">{a.date}</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{a.property}</p>
                    </div>
                    <Link href={`/schedules/${a.id}`} className="text-xs text-red-500 hover:text-red-700">
                      対応する
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* 今後7日間の予定 */}
      <section>
        <div className="mb-2">
          <WeekNav label="今後7日間の予定" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {sevenDays.map((ymd) => {
            const isToday = ymd === today;
            const dayJobs = jobsByDate.get(ymd) ?? [];
            return (
              <div key={ymd} className={`rounded-lg border p-2 ${isToday ? "border-zinc-900 bg-white dark:border-zinc-50 dark:bg-zinc-950" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"}`}>
                <p className={`mb-2 text-center text-xs font-medium ${isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500"}`}>
                  {gridLabel(ymd)}
                </p>
                <div className="space-y-1">
                  {dayJobs.length === 0 ? (
                    <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-700">—</p>
                  ) : dayJobs.map((job) => (
                    <Link key={job.id} href={`/schedules/${job.id}`} className="block">
                      <div className={`rounded px-1 py-0.5 text-[10px] leading-tight ${!job.cleaner_id ? "bg-red-100 text-red-700" : STATUS_CHIP[job.status]}`}>
                        <p className="truncate font-medium">{propMap.get(job.property_id) ?? "不明"}</p>
                        {job.scheduled_start_time && <p className="opacity-70">{job.scheduled_start_time.slice(0, 5)}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-right">
          <Link href="/schedules" className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
            スケジュール一覧 →
          </Link>
        </div>
      </section>
    </div>
  );
}
