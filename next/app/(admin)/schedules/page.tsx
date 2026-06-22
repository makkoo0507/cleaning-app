import Link from "next/link";
import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Job, Property, User } from "@/lib/database.types";
import { JOB_STATUS_LABEL } from "@/lib/database.types";
import { formatDateShort, formatTime } from "@/lib/format";
import { PageHeader, PrimaryLink, EmptyState, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const admin = isAdmin(await requireContractor());
  const supabase = await createClient();

  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .order("scheduled_date", { ascending: false })
        .order("scheduled_start_time", { ascending: true }),
      supabase.from("properties").select("id, name"),
      supabase.from("users").select("id, name").eq("role", "cleaner"),
    ]);

  const jobs = (jobsData as Job[]) ?? [];
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
      <PageHeader
        title="スケジュール"
        action={
          admin ? (
            <PrimaryLink href="/schedules/new">+ 案件を作成</PrimaryLink>
          ) : null
        }
      />

      {jobs.length === 0 ? (
        <EmptyState>案件がまだ登録されていません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">清掃日</th>
                <th className="px-4 py-3 font-medium">時刻</th>
                <th className="px-4 py-3 font-medium">物件</th>
                <th className="px-4 py-3 font-medium">担当清掃者</th>
                <th className="px-4 py-3 font-medium">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3">
                    <Link href={`/schedules/${job.id}`} className="block">
                      {formatDateShort(job.scheduled_date)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <Link href={`/schedules/${job.id}`} className="block">
                      {formatTime(job.scheduled_start_time)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    <Link href={`/schedules/${job.id}`} className="block">
                      {propMap.get(job.property_id) ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <Link href={`/schedules/${job.id}`} className="block">
                      {job.cleaner_id
                        ? cleanerMap.get(job.cleaner_id) ?? "—"
                        : "未アサイン"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{JOB_STATUS_LABEL[job.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
