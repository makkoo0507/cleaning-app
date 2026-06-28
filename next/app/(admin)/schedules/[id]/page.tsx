import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CleaningRecord, Job, Property, User } from "@/lib/database.types";
import { formatDateShort } from "@/lib/format";
import { updateJob, deleteJob, upsertRecord } from "../actions";
import JobForm from "../JobForm";
import RecordForm from "../RecordForm";
import { DeleteButton } from "@/components/DeleteButton";
import { CreatedBanner } from "@/components/CreatedBanner";
import { PageHeader } from "@/components/ui";

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
  await requireAdmin();
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from ? `/schedules?view=${from}` : "/schedules";

  const supabase = await createClient();

  const [{ data: job }, { data: propsData }, { data: cleanersData }] =
    await Promise.all([
      supabase.from("jobs").select("*").eq("id", id).single<Job>(),
      supabase.from("properties").select("id, name").order("name"),
      supabase.from("users").select("id, name").eq("role", "cleaner").order("name"),
    ]);
  if (!job) notFound();

  const [{ data: property }, { data: record }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", job.property_id).single<Property>(),
    supabase
      .from("cleaning_records")
      .select("*")
      .eq("job_id", id)
      .order("started_at", { ascending: false })
      .maybeSingle<CleaningRecord>(),
  ]);

  const action = updateJob.bind(null, id);

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={backHref}
        className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        ← スケジュール一覧
      </Link>

      <CreatedBanner />

      <PageHeader
        title="案件詳細"
        action={
          <DeleteButton
            action={deleteJob}
            id={id}
            name={`${property?.name ?? "案件"} (${formatDateShort(job.scheduled_date)})`}
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          />
        }
      />

      <JobForm
        action={action}
        job={job}
        properties={(propsData as Pick<Property, "id" | "name">[]) ?? []}
        cleaners={(cleanersData as Pick<User, "id" | "name">[]) ?? []}
      />

      {(property?.address || property?.notes) && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            物件情報
          </h2>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            {property?.address && <Row label="住所" value={property.address} />}
            {property?.notes && <Row label="特記事項" value={property.notes} />}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          清掃記録
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <RecordForm action={upsertRecord.bind(null, id)} record={record} />
        </div>
      </section>
    </div>
  );
}
