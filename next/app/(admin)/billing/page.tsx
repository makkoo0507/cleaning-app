import Link from "next/link";
import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getContractorFlags } from "@/lib/contractor";
import type { Job, Property, User } from "@/lib/database.types";
import { JOB_STATUS_LABEL } from "@/lib/database.types";
import { formatDateShort, formatYen, jstMonthRange } from "@/lib/format";
import { PageHeader, Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireContractor();
  const admin = isAdmin(user);
  // 請求・支払い機能が無効のときは案内を表示（有料オプション）
  const { billingEnabled, isPaid } = await getContractorFlags(user.contractorId);
  if (!billingEnabled) {
    return (
      <div className="max-w-lg space-y-4">
        <PageHeader title="請求・支払い（有料オプション）" />
        <div className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            案件ごとの請求額・支払い額の記録、月次集計、CSV
            出力ができる有料オプション機能です。
          </p>
          {isPaid ? (
            <>
              <p className="mt-2 text-sm text-zinc-500">
                現在この機能は無効です。
              </p>
              {admin ? (
                <Link
                  href="/settings"
                  className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
                >
                  設定で有効にする
                </Link>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  利用するには管理者にお問い合わせください。
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              ご利用には有料プランへのアップグレードが必要です。プラン変更の窓口にお問い合わせください。
            </p>
          )}
        </div>
      </div>
    );
  }
  const { month } = await searchParams;
  const { start, end, label, value } = jstMonthRange(month);

  const supabase = await createClient();
  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .gte("scheduled_date", start)
        .lte("scheduled_date", end)
        .order("scheduled_date", { ascending: true }),
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

  const totalBilling = jobs.reduce((s, j) => s + (j.billing_amount ?? 0), 0);
  const totalPayment = jobs.reduce((s, j) => s + (j.payment_amount ?? 0), 0);

  // 前月・翌月リンク
  const shift = (delta: number) => {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };

  const canEdit = isAdmin(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="請求・支払い"
        action={
          <a
            href={`/billing/export?month=${value}`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
          >
            CSVエクスポート
          </a>
        }
      />

      <div className="flex items-center gap-4 text-sm">
        <Link
          href={`/billing?month=${shift(-1)}`}
          className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← 前月
        </Link>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {label}
        </span>
        <Link
          href={`/billing?month=${shift(1)}`}
          className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          翌月 →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="案件数" value={jobs.length} />
        <Card label="請求額 合計" value={formatYen(totalBilling)} />
        <Card label="支払い額 合計" value={formatYen(totalPayment)} />
      </div>

      {!canEdit && (
        <p className="text-xs text-zinc-500">
          ※ 金額の編集は管理者のみ可能です（社員は閲覧のみ）。
        </p>
      )}

      {jobs.length === 0 ? (
        <EmptyState>{label}の案件はありません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">清掃日</th>
                <th className="px-4 py-3 font-medium">物件</th>
                <th className="px-4 py-3 font-medium">清掃者</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 text-right font-medium">請求額</th>
                <th className="px-4 py-3 text-right font-medium">支払い額</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3">
                    {formatDateShort(job.scheduled_date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {propMap.get(job.property_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {job.cleaner_id
                      ? cleanerMap.get(job.cleaner_id) ?? "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {JOB_STATUS_LABEL[job.status]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatYen(job.billing_amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatYen(job.payment_amount)}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/schedules/${job.id}/edit`}
                        className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        金額編集
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
