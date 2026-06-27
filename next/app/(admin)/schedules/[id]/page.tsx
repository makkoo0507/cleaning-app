import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getContractorFlags } from "@/lib/contractor";
import type {
  CleaningRecord,
  Job,
  Property,
  User,
} from "@/lib/database.types";
import { JOB_STATUS_LABEL } from "@/lib/database.types";
import {
  formatDateShort,
  formatTime,
  formatDateTime,
  formatDuration,
  formatYen,
} from "@/lib/format";
import { deleteJob } from "../actions";
import { PageHeader, Badge } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-2 text-sm dark:border-zinc-800">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-50">{value}</span>
    </div>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const { billingEnabled } = await getContractorFlags(user.contractorId);
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from ? `/schedules?view=${from}` : "/schedules";
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single<Job>();
  if (!job) notFound();

  const [{ data: property }, { data: record }] = await Promise.all([
    supabase
      .from("properties")
      .select("*")
      .eq("id", job.property_id)
      .single<Property>(),
    supabase
      .from("cleaning_records")
      .select("*")
      .eq("job_id", id)
      .order("started_at", { ascending: false })
      .maybeSingle<CleaningRecord>(),
  ]);

  let cleaner: Pick<User, "name"> | null = null;
  if (job.cleaner_id) {
    const { data } = await supabase
      .from("users")
      .select("name")
      .eq("id", job.cleaner_id)
      .maybeSingle<Pick<User, "name">>();
    cleaner = data;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={backHref}
        className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        ← スケジュール一覧
      </Link>
      <PageHeader
        title="案件詳細"
        action={
          admin ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/schedules/${id}/edit`}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                編集
              </Link>
              <DeleteButton
                action={deleteJob}
                id={id}
                name={`${property?.name ?? "案件"} (${formatDateShort(job.scheduled_date)})`}
                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              />
            </div>
          ) : null
        }
      />

      <section className="rounded-md border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <Row label="物件" value={property?.name ?? "—"} />
        <Row label="住所" value={property?.address ?? "—"} />
        <Row label="清掃日" value={formatDateShort(job.scheduled_date)} />
        <Row label="開始予定時刻" value={formatTime(job.scheduled_start_time)} />
        <Row
          label="担当清掃者"
          value={cleaner?.name ?? "未アサイン"}
        />
        <Row label="状態" value={<Badge>{JOB_STATUS_LABEL[job.status]}</Badge>} />
        {billingEnabled && (
          <>
            <Row label="請求額" value={formatYen(job.billing_amount)} />
            <Row label="支払い額" value={formatYen(job.payment_amount)} />
          </>
        )}
        {property?.notes && <Row label="特記事項" value={property.notes} />}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          清掃記録
        </h2>
        {record ? (
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <Row label="開始時刻" value={formatDateTime(record.started_at)} />
            <Row label="完了時刻" value={formatDateTime(record.completed_at)} />
            <Row
              label="所要時間"
              value={formatDuration(record.duration_minutes)}
            />
            <Row label="共有" value={record.memo ?? "—"} />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            まだ清掃記録はありません。
          </p>
        )}
      </section>
    </div>
  );
}
