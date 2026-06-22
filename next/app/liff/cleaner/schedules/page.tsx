import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import StatusBadge from "@/app/liff/_components/StatusBadge";
import { formatDateShort, formatTime } from "@/lib/format";
import type { Job, Property } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type JobRow = Job & { properties: Pick<Property, "name" | "address"> };

export default async function CleanerSchedulesPage() {
  const user = await getLiffUser();
  if (!user || user.role !== "cleaner") {
    return <LiffBootstrap liffId={LIFF_ID} expectedRole="cleaner" />;
  }

  // 本人がアサインされた案件のみ（cleaner_id で明示スコープ）
  const admin = createAdminClient();
  const { data } = await admin
    .from("jobs")
    .select("*, properties(name, address)")
    .eq("cleaner_id", user.id)
    .order("scheduled_date", { ascending: false });
  const jobs = (data as JobRow[]) ?? [];

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          マイスケジュール
        </h1>
        <span className="text-sm text-zinc-500">{user.name}</span>
      </div>

      {jobs.length === 0 ? (
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
