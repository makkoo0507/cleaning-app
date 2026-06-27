"use client";

import { useState } from "react";
import Link from "next/link";

export type CalendarJob = {
  id: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  status: string;
  propertyName: string;
  cleanerName: string | null;
};

type View = "month" | "week" | "agenda";

const DOW = ["月", "火", "水", "木", "金", "土", "日"];

const STATUS_CHIP: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};
const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-blue-500",
  in_progress: "bg-amber-500",
  completed: "bg-green-500",
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: "予定",
  in_progress: "作業中",
  completed: "完了",
};

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function groupByDate(jobs: CalendarJob[]): Map<string, CalendarJob[]> {
  const map = new Map<string, CalendarJob[]>();
  for (const job of jobs) {
    const arr = map.get(job.scheduled_date) ?? [];
    arr.push(job);
    map.set(job.scheduled_date, arr);
  }
  return map;
}

// ─── Legend ──────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex gap-4 text-xs text-zinc-500">
      {Object.entries(STATUS_LABEL).map(([k, v]) => (
        <span key={k} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[k]}`} />
          {v}
        </span>
      ))}
    </div>
  );
}

// ─── Nav bar ─────────────────────────────────────────────────────
function NavBar({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const btn = "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";
  return (
    <div className="flex items-center gap-3">
      <button onClick={onPrev} className={btn}>←</button>
      <span className="min-w-[160px] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {label}
      </span>
      <button onClick={onNext} className={btn}>→</button>
      <button
        onClick={onToday}
        className="ml-1 text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        今日
      </button>
    </div>
  );
}

// ─── Month view ──────────────────────────────────────────────────
function MonthView({
  year,
  month,
  todayStr,
  jobsByDate,
}: {
  year: number;
  month: number;
  todayStr: string;
  jobsByDate: Map<string, CalendarJob[]>;
}) {
  // Build 6-week grid starting from Monday
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - (startDow === 0 ? 6 : startDow - 1));

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium ${
              i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-zinc-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map((date, idx) => {
          const ymd = toYMD(date);
          const dayJobs = jobsByDate.get(ymd) ?? [];
          const isCurrentMonth = date.getMonth() === month;
          const isToday = ymd === todayStr;
          const col = idx % 7; // 0=月…5=土 6=日
          const isSat = col === 5;
          const isSun = col === 6;

          return (
            <div
              key={idx}
              className={`min-h-[96px] border-b border-r border-zinc-100 p-1 dark:border-zinc-800 ${
                col === 6 ? "border-r-0" : ""
              } ${!isCurrentMonth ? "bg-zinc-50 dark:bg-zinc-900/40" : ""}`}
            >
              {/* Date number */}
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : isSat
                    ? "text-blue-500"
                    : isSun
                    ? "text-red-500"
                    : isCurrentMonth
                    ? "text-zinc-800 dark:text-zinc-200"
                    : "text-zinc-300 dark:text-zinc-600"
                }`}
              >
                {date.getDate()}
              </div>

              {/* Job chips */}
              <div className="space-y-0.5">
                {dayJobs.slice(0, 3).map((job) => (
                  <Link
                    key={job.id}
                    href={`/schedules/${job.id}`}
                    className={`block truncate rounded px-1 py-0.5 text-[11px] leading-tight ${STATUS_CHIP[job.status]}`}
                  >
                    {job.scheduled_start_time
                      ? job.scheduled_start_time.slice(0, 5) + " "
                      : ""}
                    {job.propertyName}
                  </Link>
                ))}
                {dayJobs.length > 3 && (
                  <p className="px-1 text-[11px] text-zinc-400">
                    +{dayJobs.length - 3}件
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week view ───────────────────────────────────────────────────
function WeekView({
  weekStart,
  todayStr,
  jobsByDate,
}: {
  weekStart: Date;
  todayStr: string;
  jobsByDate: Map<string, CalendarJob[]>;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((date, i) => {
        const ymd = toYMD(date);
        const dayJobs = jobsByDate.get(ymd) ?? [];
        const isToday = ymd === todayStr;
        const isSat = i === 5;
        const isSun = i === 6;

        return (
          <div
            key={i}
            className={`rounded-md border bg-white p-2 dark:bg-zinc-950 ${
              isToday
                ? "border-zinc-900 dark:border-zinc-50"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <p
              className={`text-center text-xs font-medium ${
                isSat ? "text-blue-500" : isSun ? "text-red-500" : "text-zinc-500"
              }`}
            >
              {DOW[i]}
            </p>
            <p
              className={`mb-2 text-center text-base font-semibold ${
                isToday
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {date.getDate()}
            </p>
            <div className="space-y-1">
              {dayJobs.length === 0 ? (
                <p className="text-center text-[11px] text-zinc-300 dark:text-zinc-700">
                  —
                </p>
              ) : (
                dayJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/schedules/${job.id}`}
                    className={`block rounded p-1 text-[11px] leading-tight ${STATUS_CHIP[job.status]}`}
                  >
                    {job.scheduled_start_time && (
                      <p className="font-medium">
                        {job.scheduled_start_time.slice(0, 5)}
                      </p>
                    )}
                    <p className="truncate">{job.propertyName}</p>
                    {job.cleanerName && (
                      <p className="truncate text-[10px] opacity-70">
                        {job.cleanerName}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Agenda view ─────────────────────────────────────────────────
function AgendaView({
  todayStr,
  today,
  jobsByDate,
}: {
  todayStr: string;
  today: Date;
  jobsByDate: Map<string, CalendarJob[]>;
}) {
  // 過去7日〜先60日
  const dates = Array.from({ length: 67 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 7);
    return d;
  }).filter((d) => (jobsByDate.get(toYMD(d)) ?? []).length > 0);

  if (dates.length === 0) {
    return <p className="text-sm text-zinc-500">案件がありません。</p>;
  }

  return (
    <div className="space-y-1">
      {dates.map((date) => {
        const ymd = toYMD(date);
        const dayJobs = jobsByDate.get(ymd) ?? [];
        const isToday = ymd === todayStr;
        const dow = date.getDay(); // 0=Sun
        const dowLabel = DOW[dow === 0 ? 6 : dow - 1];
        const isSat = dow === 6;
        const isSun = dow === 0;

        return (
          <div key={ymd} className="flex gap-4">
            {/* Date column */}
            <div
              className={`w-20 flex-shrink-0 pt-3 text-right text-sm ${
                isToday
                  ? "font-bold text-zinc-900 dark:text-zinc-50"
                  : isSat
                  ? "text-blue-500"
                  : isSun
                  ? "text-red-500"
                  : "text-zinc-500"
              }`}
            >
              <span>
                {date.getMonth() + 1}/{date.getDate()}
              </span>
              <span className="ml-1 text-xs">({dowLabel})</span>
              {isToday && (
                <span className="ml-1 text-[10px] font-bold">今日</span>
              )}
            </div>

            {/* Jobs column */}
            <div className="flex-1 space-y-1 border-l-2 border-zinc-200 pl-4 pt-3 dark:border-zinc-800">
              {dayJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/schedules/${job.id}`}
                  className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[job.status]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {job.propertyName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {job.scheduled_start_time
                        ? job.scheduled_start_time.slice(0, 5)
                        : "時刻未定"}
                      {" · "}
                      {job.cleanerName ?? "未アサイン"}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] ${STATUS_CHIP[job.status]}`}
                  >
                    {STATUS_LABEL[job.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function CalendarView({
  jobs,
  defaultView = "month",
}: {
  jobs: CalendarJob[];
  defaultView?: View;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toYMD(today);

  const [view, setView] = useState<View>(defaultView);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weekStart, setWeekStart] = useState(() => getMondayOf(today));

  const jobsByDate = groupByDate(jobs);

  const tabCls = (v: View) =>
    view === v
      ? "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      : "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

  // Month navigation
  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  // Week navigation
  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekLabel = `${weekDays[0].getMonth() + 1}/${weekDays[0].getDate()} 〜 ${weekDays[6].getMonth() + 1}/${weekDays[6].getDate()}`;

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="flex gap-2">
        <button onClick={() => setView("agenda")} className={tabCls("agenda")}>リスト</button>
        <button onClick={() => setView("month")} className={tabCls("month")}>月</button>
        <button onClick={() => setView("week")} className={tabCls("week")}>週</button>
      </div>

      {/* Navigation */}
      {view === "month" && (
        <NavBar
          label={`${year}年${month + 1}月`}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
        />
      )}
      {view === "week" && (
        <NavBar
          label={weekLabel}
          onPrev={prevWeek}
          onNext={nextWeek}
          onToday={() => setWeekStart(getMondayOf(today))}
        />
      )}

      {/* Calendar body */}
      {view === "month" && (
        <MonthView year={year} month={month} todayStr={todayStr} jobsByDate={jobsByDate} />
      )}
      {view === "week" && (
        <WeekView weekStart={weekStart} todayStr={todayStr} jobsByDate={jobsByDate} />
      )}
      {view === "agenda" && (
        <AgendaView todayStr={todayStr} today={today} jobsByDate={jobsByDate} />
      )}

      {view !== "agenda" && <Legend />}
    </div>
  );
}
