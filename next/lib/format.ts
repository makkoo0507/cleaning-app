// 表示用フォーマッタ

export function formatYen(n: number | null | undefined): string {
  if (n == null) return "—";
  return "¥" + Number(n).toLocaleString("ja-JP");
}

// 'YYYY-MM-DD' を 'M/D(曜)' に
export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const w = ["日", "月", "火", "水", "木", "金", "土"][date.getUTCDay()];
  return `${m}/${d}(${w})`;
}

// 'HH:MM:SS' or 'HH:MM' -> 'HH:MM'
export function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

// timestamptz -> 'M/D HH:MM'（JST 表示）
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${m}/${d} ${hh}:${mm}`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

// JST 基準の今日 / 今週（月〜日）
export function jstDateRanges() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate())
  );
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);

  const dow = (today.getUTCDay() + 6) % 7; // 月曜=0
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - dow);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return { today: iso(today), weekStart: iso(weekStart), weekEnd: iso(weekEnd) };
}

// 今月の初日・末日
export function jstMonthRange(yyyymm?: string) {
  const base = yyyymm
    ? new Date(`${yyyymm}-01T00:00:00Z`)
    : (() => {
        const now = new Date();
        const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1));
      })();
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  return {
    start: iso(start),
    end: iso(end),
    label: `${y}年${m + 1}月`,
    value: `${y}-${String(m + 1).padStart(2, "0")}`,
  };
}
