import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";
import CleanerJobActions from "./CleanerJobActions";
import {
  formatDateShort,
  formatTime,
  formatDateTime,
  formatDuration,
} from "@/lib/format";
import type { CleaningRecord, Job, Property } from "@/lib/database.types";

type ImageWithUrl = {
  id: string;
  storage_path: string;
  share_with_owner: boolean;
  url: string;
};

export const dynamic = "force-dynamic";

type JobDetail = Job & {
  properties: Pick<Property, "name" | "address" | "notes">;
};

export default async function CleanerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getLiffUser();
  if (!user || user.role !== "cleaner") {
    return <LiffBootstrap liffId={LIFF_ID} expectedRole="cleaner" />;
  }

  const { id } = await params;
  const admin = createAdminClient();

  // 本人がアサインされた案件のみ（cleaner_id で明示スコープ）
  const { data: job } = await admin
    .from("jobs")
    .select("*, properties(name, address, notes)")
    .eq("id", id)
    .eq("cleaner_id", user.id)
    .maybeSingle<JobDetail>();

  if (!job) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-red-600">案件が見つかりません。</p>
        <Link
          href="/liff/cleaner/schedules"
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

  // 写真一覧（署名付きURL付き・有効期限1時間）
  const internalBase = process.env.SUPABASE_URL ?? "";
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const toPublicUrl = (url: string) =>
    internalBase && publicBase && internalBase !== publicBase
      ? url.replace(internalBase, publicBase)
      : url;

  const { data: rawImages } = await admin
    .from("cleaning_images")
    .select("id, storage_path, share_with_owner")
    .eq("job_id", id)
    .order("created_at");

  let images: ImageWithUrl[] = [];
  if (rawImages && rawImages.length > 0) {
    const { data: signed } = await admin.storage
      .from("cleaning-images")
      .createSignedUrls(
        rawImages.map((img) => img.storage_path),
        3600
      );
    images = rawImages.map((img, i) => ({
      ...img,
      url: toPublicUrl(signed?.[i]?.signedUrl ?? ""),
    }));
  }

  return (
    <div className="px-4 py-6">
      <Link
        href="/liff/cleaner/schedules"
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
        <p className="text-sm text-zinc-500">清掃予定日時</p>
        <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
          {formatDateShort(job.scheduled_date)}{" "}
          {formatTime(job.scheduled_start_time)}
        </p>
      </div>

      {record && (
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
            {record.completed_at && (
              <>
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
              </>
            )}
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
      )}

      <CleanerJobActions
        jobId={job.id}
        status={job.status}
        initialMemo={record?.memo ?? ""}
        images={images}
      />
    </div>
  );
}
