import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_IDS } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import StatusBadge from "@/app/liff/_components/StatusBadge";
import { formatDateShort, formatTime } from "@/lib/format";
import type { Job, Property } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type JobRow = Job & { properties: Pick<Property, "name" | "address"> };

export default async function OwnerSchedulesPage() {
  const user = await getLiffUser();
  if (!user || user.role !== "contact") {
    return <LiffBootstrap liffId={LIFF_IDS.contact} />;
  }

  const admin = createAdminClient();

  // 本人が関係者登録されている物件のみに明示スコープ
  const { data: members } = await admin
    .from("property_members")
    .select("property_id")
    .eq("user_id", user.id);
  const propertyIds = (members ?? []).map((m) => m.property_id);

  let jobs: JobRow[] = [];
  if (propertyIds.length > 0) {
    const { data } = await admin
      .from("jobs")
      .select("*, properties(name, address)")
      .in("property_id", propertyIds)
      .order("scheduled_date", { ascending: false });
    jobs = (data as JobRow[]) ?? [];
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          清掃スケジュール
        </h1>
        <span className="text-sm text-zinc-500">{user.name}</span>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-zinc-500">案件はありません。</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/liff/owner/jobs/${job.id}`}
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
