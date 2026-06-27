import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import StatusBadge from "@/app/liff/_components/StatusBadge";
import { formatDateShort, formatTime } from "@/lib/format";
import type { Job, Property } from "@/lib/database.types";

type PropertyWithDefaults = Pick<Property, "id" | "name" | "default_start_time" | "default_billing_amount">;

export const dynamic = "force-dynamic";

type JobRow = Job & { properties: Pick<Property, "name" | "address"> };

export default async function OwnerSchedulesPage() {
  const user = await getLiffUser();
  if (!user || user.role !== "contact") {
    return <LiffBootstrap liffId={LIFF_ID} expectedRole="contact" />;
  }

  const admin = createAdminClient();

  // 本人が関係者登録されている物件のみに明示スコープ
  const { data: members } = await admin
    .from("property_members")
    .select("property_id")
    .eq("user_id", user.id);
  const propertyIds = (members ?? []).map((m) => m.property_id);

  // 物件情報（依頼ボタン用）
  const { data: propertiesData } = propertyIds.length > 0
    ? await admin.from("properties").select("id, name, default_start_time, default_billing_amount").in("id", propertyIds)
    : { data: [] };
  const properties = (propertiesData as PropertyWithDefaults[]) ?? [];

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
