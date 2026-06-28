import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import StatusBadge from "@/app/liff/_components/StatusBadge";
import {
  formatDateShort,
  formatTime,
  formatDateTime,
  formatDuration,
} from "@/lib/format";
import type { CleaningImage, CleaningRecord, Job, Property } from "@/lib/database.types";
import OwnerPhotoGallery from "./OwnerPhotoGallery";

export const dynamic = "force-dynamic";

type JobDetail = Job & {
  properties: Pick<Property, "name" | "address" | "notes">;
};

export default async function OwnerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getLiffUser();
  if (!user || user.role !== "contact") {
    return <LiffBootstrap liffId={LIFF_ID} expectedRole="contact" />;
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select("*, properties(name, address, notes)")
    .eq("id", id)
    .maybeSingle<JobDetail>();

  // アクセス権: 本人がその物件の関係者か明示確認
  let allowed = false;
  if (job) {
    const { data: member } = await admin
      .from("property_members")
      .select("user_id")
      .eq("property_id", job.property_id)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = !!member;
  }

  if (!job || !allowed) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-red-600">案件が見つかりません。</p>
        <Link
          href="/liff/owner/schedules"
          className="mt-4 inline-block text-sm text-zinc-500 underline"
        >
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const { data: record } = await admin
    .from("cleaning_records")
    .select("*")
    .eq("job_id", id)
    .maybeSingle<CleaningRecord>();

  const { data: images } = await admin
    .from("cleaning_images")
    .select("*")
    .eq("job_id", id)
    .eq("share_with_owner", true)
    .order("created_at")
    .returns<CleaningImage[]>();

  const internalBase = process.env.SUPABASE_URL ?? "";
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const toPublicUrl = (url: string) =>
    internalBase && publicBase && internalBase !== publicBase
      ? url.replace(internalBase, publicBase)
      : url;

  const photos: { id: string; url: string; filename: string }[] = [];
  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path);
    const { data: signed } = await admin.storage
      .from("cleaning-images")
      .createSignedUrls(paths, 3600);
    if (signed) {
      for (const img of images) {
        const entry = signed.find((s) => s.path === img.storage_path);
        if (entry?.signedUrl) {
          photos.push({
            id: img.id,
            url: toPublicUrl(entry.signedUrl),
            filename: img.storage_path.split("/").pop() ?? "photo.jpg",
          });
        }
      }
    }
  }

  return (
    <div className="px-4 py-6">
      <Link
        href="/liff/owner/schedules"
        className="mb-4 inline-block text-sm text-zinc-500"
      >
        ← 一覧に戻る
      </Link>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {job.properties.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {job.properties.address}
        </p>
        {job.properties.notes && (
          <p className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {job.properties.notes}
          </p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">清掃予定日時</p>
            <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
              {formatDateShort(job.scheduled_date)}{" "}
              {formatTime(job.scheduled_start_time)}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </div>

      {record?.completed_at ? (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            清掃記録
          </p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">開始</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {formatDateTime(record.started_at)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">完了</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {formatDateTime(record.completed_at)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">所要時間</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">
                {formatDuration(record.duration_minutes)}
              </dd>
            </div>
            {record.memo && (
              <div className="pt-1">
                <dt className="text-zinc-500">共有</dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {record.memo}
                </dd>
              </div>
            )}
          </dl>
        </div>
      ) : job.status !== "scheduled" ? (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          清掃中です。完了後に記録が表示されます。
        </div>
      ) : null}

      <OwnerPhotoGallery photos={photos} />
    </div>
  );
}
