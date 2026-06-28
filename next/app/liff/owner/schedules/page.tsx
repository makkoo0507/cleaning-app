import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import { jstDateRanges, formatTime } from "@/lib/format";
import type { CleaningRequest, Job, Property } from "@/lib/database.types";

type PropertyWithDefaults = Pick<Property, "id" | "name" | "default_start_time" | "default_billing_amount">;

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

type JobRow = Pick<Job, "id" | "property_id" | "cleaner_id" | "scheduled_date" | "scheduled_start_time" | "status"> & { properties: Pick<Property, "name" | "address"> };

export default async function OwnerSchedulesPage() {
  const user = await getLiffUser();
  if (!user || user.role !== "contact") {
    return <LiffBootstrap liffId={LIFF_ID} expectedRole="contact" />;
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

  const { data: members } = await admin
    .from("property_members")
    .select("property_id")
    .eq("user_id", user.id);
  const propertyIds = (members ?? []).map((m) => m.property_id);

  const { data: propertiesData } = propertyIds.length > 0
    ? await admin.from("properties").select("id, name, default_start_time, default_billing_amount").in("id", propertyIds)
    : { data: [] };
  const properties = (propertiesData as PropertyWithDefaults[]) ?? [];

  let jobs: JobRow[] = [];
  if (propertyIds.length > 0) {
    const { data } = await admin
      .from("jobs")
      .select("id, property_id, cleaner_id, scheduled_date, scheduled_start_time, status, properties(name, address)")
      .in("property_id", propertyIds)
      .gte("scheduled_date", dateFrom)
      .lte("scheduled_date", dateTo)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_start_time", { ascending: true });
    jobs = (data as unknown as JobRow[]) ?? [];
  }

  // 自分が送った依頼（pending・rejected）かつ紐付き物件のみ
  const { data: requestsData } = propertyIds.length > 0 ? await admin
    .from("cleaning_requests")
    .select("*, properties(name)")
    .eq("requested_by", user.id)
    .in("property_id", propertyIds)
    .in("status", ["pending", "rejected"])
    .gte("requested_date", dateFrom)
    .lte("requested_date", dateTo)
    .order("requested_date", { ascending: true })
  : { data: [] };

  type RequestRow = CleaningRequest & { properties: { name: string } | null };
  const requests = (requestsData as RequestRow[]) ?? [];

  // 日付でグループ化（ジョブ）
  const grouped = new Map<string, JobRow[]>();
  for (const job of jobs) {
    const arr = grouped.get(job.scheduled_date) ?? [];
    arr.push(job);
    grouped.set(job.scheduled_date, arr);
  }

  // 依頼も同じ日付マップに追加（キーを分けて管理）
  const requestsByDate = new Map<string, RequestRow[]>();
  for (const req of requests) {
    const arr = requestsByDate.get(req.requested_date) ?? [];
    arr.push(req);
    requestsByDate.set(req.requested_date, arr);
  }

  const allDates = Array.from(new Set([...grouped.keys(), ...requestsByDate.keys()])).sort();
  const dates = allDates;

  const DOW = ["日", "月", "火", "水", "木", "金", "土"];
  function dateLabel(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    const dow = DOW[new Date(y, m - 1, d).getDay()];
    return `${m}/${d}（${dow}）`;
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">清掃スケジュール</h1>
        <span className="text-sm text-zinc-500">{user.name}</span>
      </div>

      {/* 依頼ボタン */}
      {properties.length > 0 && (
        <div className="mb-4 space-y-2">
          {properties.map((p) => {
            const params = new URLSearchParams({
              property_id: p.id,
              property_name: p.name,
              ...(p.default_start_time ? { default_time: p.default_start_time.slice(0, 5) } : {}),
              ...(p.default_billing_amount != null ? { default_billing: String(p.default_billing_amount) } : {}),
            });
            return (
              <Link
                key={p.id}
                href={`/liff/owner/request?${params.toString()}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950/40"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</span>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                  清掃を依頼する
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {dates.length === 0 ? (
        <p className="text-sm text-zinc-500">案件・依頼はありません。</p>
      ) : (
        <div className="space-y-1">
          {dates.map((ymd) => {
            const dayJobs = grouped.get(ymd) ?? [];
            const dayReqs = requestsByDate.get(ymd) ?? [];
            return (
              <div key={ymd} className="flex gap-3">
                <div className="w-16 flex-shrink-0 pt-3 text-right text-sm text-zinc-500">
                  {dateLabel(ymd)}
                </div>
                <div className="flex-1 space-y-1 border-l-2 border-zinc-200 pl-3 pt-3 dark:border-zinc-700">
                  {dayReqs.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 border-l-4 border-l-slate-400 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-slate-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {req.properties?.name ?? "不明"}
                        </p>
                        {req.note && <p className="truncate text-xs text-zinc-500">{req.note}</p>}
                        {req.status === "rejected" && req.rejection_reason && (
                          <p className="text-xs text-red-500">却下理由: {req.rejection_reason}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] ${req.status === "rejected" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600"}`}>
                        {req.status === "rejected" ? "却下" : "承認待ち"}
                      </span>
                    </div>
                  ))}
                  {dayJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/liff/owner/jobs/${job.id}`}
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
