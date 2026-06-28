import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { CleaningRequest, Property, User } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import { RejectRequestButton } from "@/components/RejectRequestButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending:  "承認待ち",
  approved: "承認済み",
  rejected: "却下",
};
const STATUS_CHIP: Record<string, string> = {
  pending:  "bg-slate-200 text-slate-600",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-2 text-sm dark:border-zinc-800">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-50">{value}</span>
    </div>
  );
}

type RequestRow = CleaningRequest & {
  property: Pick<Property, "name" | "address"> | null;
  requester: Pick<User, "name"> | null;
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from("cleaning_requests")
    .select("*, property:properties(name, address), requester:users(name)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const req = data as unknown as RequestRow;

  const [, m, d] = req.requested_date.split("-");
  const dateLabel = `${parseInt(m)}月${parseInt(d)}日`;

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/requests" className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
        ← 依頼一覧
      </Link>

      <PageHeader
        title="依頼詳細"
        action={
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_CHIP[req.status]}`}>
            {STATUS_LABEL[req.status]}
          </span>
        }
      />

      <div className="rounded-md border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <Row label="物件" value={req.property?.name ?? "不明"} />
        <Row label="住所" value={req.property?.address ?? "—"} />
        <Row label="依頼者" value={req.requester?.name ?? "不明"} />
        <Row label="希望日" value={dateLabel} />
        <Row
          label="希望時刻"
          value={req.requested_start_time ? req.requested_start_time.slice(0, 5) : "未指定"}
        />
        {req.note && <Row label="メモ" value={req.note} />}
        {req.status === "rejected" && req.rejection_reason && (
          <Row label="却下理由" value={<span className="text-red-600">{req.rejection_reason}</span>} />
        )}
        <Row
          label="依頼日時"
          value={new Date(req.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
        />
      </div>

      {req.status === "pending" && (
        <div className="flex justify-end gap-3">
          <RejectRequestButton id={req.id} />
          <Link
            href={`/schedules/new?request_id=${req.id}`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            承認して案件を作成
          </Link>
        </div>
      )}
    </div>
  );
}
