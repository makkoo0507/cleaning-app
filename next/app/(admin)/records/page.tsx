import Link from "next/link";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  CleaningRecord,
  Job,
  Property,
  User,
} from "@/lib/database.types";
import {
  formatDateTime,
  formatDuration,
} from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  await requireContractor();
  const supabase = await createClient();

  const { data: recordsData } = await supabase
    .from("cleaning_records")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);
  const records = (recordsData as CleaningRecord[]) ?? [];

  // 関連 jobs / properties / cleaners をまとめて取得
  const jobIds = [...new Set(records.map((r) => r.job_id))];
  const { data: jobsData } = jobIds.length
    ? await supabase.from("jobs").select("*").in("id", jobIds)
    : { data: [] };
  const jobs = (jobsData as Job[]) ?? [];
  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  const [{ data: propsData }, { data: cleanersData }] = await Promise.all([
    supabase.from("properties").select("id, name"),
    supabase.from("users").select("id, name").eq("role", "cleaner"),
  ]);
  const propMap = new Map(
    ((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [
      p.id,
      p.name,
    ])
  );
  const cleanerMap = new Map(
    ((cleanersData as Pick<User, "id" | "name">[]) ?? []).map((c) => [
      c.id,
      c.name,
    ])
  );

  return (
    <div className="space-y-6">
      <PageHeader title="清掃記録" />

      {records.length === 0 ? (
        <EmptyState>清掃記録がまだありません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">物件</th>
                <th className="px-4 py-3 font-medium">清掃者</th>
                <th className="px-4 py-3 font-medium">開始</th>
                <th className="px-4 py-3 font-medium">完了</th>
                <th className="px-4 py-3 font-medium">所要時間</th>
                <th className="px-4 py-3 font-medium">共有</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {records.map((r) => {
                const job = jobMap.get(r.job_id);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {job ? (
                        <Link
                          href={`/schedules/${job.id}`}
                          className="hover:underline"
                        >
                          {propMap.get(job.property_id) ?? "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {job?.cleaner_id
                        ? cleanerMap.get(job.cleaner_id) ?? "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(r.started_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(r.completed_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDuration(r.duration_minutes)}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                      {r.memo ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
