import Link from "next/link";

// ─── ハードコードデータ ───────────────────────────────────────────

const TODAY_LABEL = "6月27日（土）";

const KPI = {
  todayJobs: 10,
  todayCompleted: 7,
  todayInProgress: 2,
  todayScheduled: 1,
  todayUnassigned: 1,
  weekJobs: 21,
  weekCompleted: 14,
  weekInProgress: 3,
  weekScheduled: 4,
  weekUnassigned: 3,
  monthJobs: 90,
  monthCompleted: 65,
  monthInProgress: 5,
  monthScheduled: 20,
  monthUnassigned: 8,
  unassigned: 3,
};

const ALERTS = [
  { id: "1", jobId: "job-001", property: "ヴィラ青山", date: "6/27" },
  { id: "2", jobId: "job-002", property: "ルーム渋谷101", date: "6/28" },
  { id: "3", jobId: "job-003", property: "マンション六本木", date: "6/30" },
];

const TODAY_JOBS = [
  { id: "t1", property: "ヴィラ青山", time: "10:00", cleaner: null, status: "scheduled" },
  { id: "t2", property: "シェアハウス代官山", time: "13:00", cleaner: "山田 花子", status: "in_progress" },
  { id: "t3", property: "アパート目黒", time: "13:00", cleaner: "鈴木 一郎", status: "scheduled" },
  { id: "t4", property: "スイート新宿", time: "15:30", cleaner: "佐藤 健", status: "completed" },
];

const WEEK_SCHEDULE = [
  {
    date: "6/27（土）", isToday: true,
    jobs: [
      { id: "w1", property: "ヴィラ青山", time: "10:00", cleaner: null, status: "scheduled" },
      { id: "w2", property: "シェアハウス代官山", time: "13:00", cleaner: "山田 花子", status: "in_progress" },
      { id: "w3", property: "スイート新宿", time: "15:30", cleaner: "佐藤 健", status: "completed" },
    ],
  },
  {
    date: "6/28（日）", isToday: false,
    jobs: [
      { id: "w4", property: "ルーム渋谷101", time: "11:00", cleaner: null, status: "scheduled" },
      { id: "w5", property: "アパート目黒", time: "14:00", cleaner: "鈴木 一郎", status: "scheduled" },
    ],
  },
  {
    date: "6/29（月）", isToday: false,
    jobs: [
      { id: "w6", property: "ヴィラ青山", time: "10:00", cleaner: "田中 美咲", status: "scheduled" },
    ],
  },
  {
    date: "6/30（火）", isToday: false,
    jobs: [
      { id: "w7", property: "マンション六本木", time: "09:00", cleaner: null, status: "scheduled" },
      { id: "w8", property: "コンド恵比寿", time: "13:00", cleaner: "山田 花子", status: "scheduled" },
    ],
  },
  { date: "7/1（水）", isToday: false, jobs: [] },
  {
    date: "7/2（木）", isToday: false,
    jobs: [
      { id: "w9", property: "スイート新宿", time: "11:00", cleaner: "佐藤 健", status: "scheduled" },
    ],
  },
  { date: "7/3（金）", isToday: false, jobs: [] },
];

const MONTHLY_TREND = [
  { week: "6/1週", count: 4 },
  { week: "6/8週", count: 7 },
  { week: "6/15週", count: 5 },
  { week: "6/22週", count: 8 },
];
const MAX_COUNT = Math.max(...MONTHLY_TREND.map((w) => w.count));

// ─── ステータス定義 ───────────────────────────────────────────────

const STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  scheduled: { label: "予定", chip: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  in_progress: { label: "作業中", chip: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  completed: { label: "完了", chip: "bg-green-100 text-green-700", dot: "bg-green-500" },
};

// ─── Page ─────────────────────────────────────────────────────────

export default function DashboardSamplePage() {

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">ダッシュボード</h1>
          <p className="text-sm text-zinc-400">{TODAY_LABEL}</p>
        </div>
        <Link
          href="/schedules/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          + 案件を作成
        </Link>
      </div>

      {/* まとめカード */}
      {(() => {
        const rows = [
          { label: "本日の案件", total: KPI.todayJobs, completed: KPI.todayCompleted, inProgress: KPI.todayInProgress, scheduled: KPI.todayScheduled, unassigned: KPI.todayUnassigned },
          { label: "今週の案件", total: KPI.weekJobs, completed: KPI.weekCompleted, inProgress: KPI.weekInProgress, scheduled: KPI.weekScheduled, unassigned: KPI.weekUnassigned },
          { label: "今月の案件", total: KPI.monthJobs, completed: KPI.monthCompleted, inProgress: KPI.monthInProgress, scheduled: KPI.monthScheduled, unassigned: KPI.monthUnassigned },
        ];
        const barWidths = [1, 5, 20]; // 固定比率 1:5:20
        const maxWidth = Math.max(...barWidths);
        return (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={row.label} className={i > 0 ? "border-t border-zinc-100 pt-2 dark:border-zinc-800" : ""}>
                  <div className="flex items-center gap-3">
                    <p className="w-20 flex-shrink-0 text-xs font-medium text-zinc-500">{row.label}</p>
                    <p className="w-8 flex-shrink-0 text-right text-lg font-bold text-zinc-900 dark:text-zinc-50">{row.total}</p>
                    <div className="flex flex-1 flex-col gap-1">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 本日の案件 + 要対応 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 本日の案件 */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">本日の案件</h2>
          {TODAY_JOBS.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
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
                  {TODAY_JOBS.map((job, i) => (
                    <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="px-3 py-2.5 text-right text-xs text-zinc-400">
                        {job.time !== TODAY_JOBS[i - 1]?.time ? job.time : ""}
                      </td>
                      <td className="border-t border-zinc-100 px-3 py-2.5 font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">{job.property}</td>
                      <td className="border-t border-zinc-100 px-3 py-2.5 text-xs text-zinc-500 dark:border-zinc-800">
                        {job.cleaner ?? <span className="text-red-500">未アサイン</span>}
                      </td>
                      <td className="border-t border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS[job.status].chip}`}>
                          {STATUS[job.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 要対応：未アサイン */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            要対応（7日以内）
            <span className="text-xs font-normal text-red-500">＊未アサイン</span>
          </h2>
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {ALERTS.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 text-xs text-zinc-400">{a.date}</span>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{a.property}</p>
                  </div>
                  <Link href={`/schedules/${a.jobId}`} className="text-xs text-red-500 hover:text-red-700">
                    対応する
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* 今後7日間のスケジュール */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">今後7日間の予定</h2>
          <Link href="/schedules" className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_SCHEDULE.map((day) => (
            <div key={day.date} className={`rounded-lg border p-2 ${day.isToday ? "border-zinc-900 bg-white dark:border-zinc-50 dark:bg-zinc-950" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"}`}>
              <p className={`mb-2 text-center text-xs font-medium ${day.isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500"}`}>
                {day.date}
              </p>
              <div className="space-y-1">
                {day.jobs.length === 0 ? (
                  <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-700">—</p>
                ) : (
                  day.jobs.map((job) => (
                    <div key={job.id} className={`rounded px-1 py-0.5 text-[10px] leading-tight ${job.cleaner === null ? "bg-red-100 text-red-700" : STATUS[job.status].chip}`}>
                      <p className="truncate font-medium">{job.property}</p>
                      {job.time && <p className="opacity-70">{job.time}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
