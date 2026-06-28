import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CleaningImage, CleaningRecord, Job, Property, User } from "@/lib/database.types";
import { formatDateShort } from "@/lib/format";
import { updateJob, deleteJob, upsertRecord } from "../actions";
import JobForm from "../JobForm";
import RecordForm from "../RecordForm";
import PhotoSection, { type ImageWithUrl } from "./PhotoSection";
import ReportSection from "./ReportSection";
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

  const [{ data: property }, { data: record }, { data: rawImages }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", job.property_id).single<Property>(),
    supabase
      .from("cleaning_records")
      .select("*")
      .eq("job_id", id)
      .order("started_at", { ascending: false })
      .maybeSingle<CleaningRecord>(),
    supabase
      .from("cleaning_images")
      .select("*")
      .eq("job_id", id)
      .order("created_at"),
  ]);

  // 署名付きURL生成（プライベートバケット）
  // ローカル環境では SUPABASE_URL が host.docker.internal になるため
  // ブラウザからアクセス可能な NEXT_PUBLIC_SUPABASE_URL に置換する
  const internalBase = process.env.SUPABASE_URL ?? "";
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const toPublicUrl = (url: string) =>
    internalBase && publicBase && internalBase !== publicBase
      ? url.replace(internalBase, publicBase)
      : url;

  const images = (rawImages as CleaningImage[] | null) ?? [];
  let imagesWithUrls: ImageWithUrl[] = [];
  if (images.length > 0) {
    const admin = createAdminClient();
    const { data: signedUrls } = await admin.storage
      .from("cleaning-images")
      .createSignedUrls(
        images.map((img) => img.storage_path),
        3600
      );
    imagesWithUrls = images.map((img, i) => ({
      ...img,
      signedUrl: toPublicUrl(signedUrls?.[i]?.signedUrl ?? ""),
    }));
  }

  // 最古の写真が53日以上前 → 削除まで7日以内
  let daysUntilDeletion: number | null = null;
  if (images.length > 0) {
    const daysSince = Math.floor(
      (Date.now() - new Date(images[0].created_at).getTime()) / 86_400_000
    );
    if (daysSince >= 53) daysUntilDeletion = Math.max(0, 60 - daysSince);
  }

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

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          写真
          {images.length > 0 && (
            <span className="ml-2 text-xs font-normal text-zinc-500">
              {images.length}枚
            </span>
          )}
        </h2>

        {daysUntilDeletion !== null && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
            この案件の写真は <strong>{daysUntilDeletion}日後</strong> に削除されます。
            必要な場合はダウンロードしてください。
          </div>
        )}

        <div className="rounded-md border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <PhotoSection jobId={id} initialImages={imagesWithUrls} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          オーナーへの報告
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <ReportSection
            jobId={id}
            propertyName={property?.name ?? ""}
            memo={record?.memo ?? null}
            reportedAt={job.reported_at}
          />
        </div>
      </section>
    </div>
  );
}
