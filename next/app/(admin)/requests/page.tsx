import Link from "next/link";
import { requireContractor, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { CleaningRequest, Property, User } from "@/lib/database.types";
import { PageHeader, EmptyState } from "@/components/ui";

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

type RequestRow = CleaningRequest & {
  property: Pick<Property, "name"> | null;
  requester: Pick<User, "name"> | null;
};

export default async function RequestsPage() {
  const user = await requireContractor();
  const admin = createAdminClient();

  const { data } = await admin
    .from("cleaning_requests")
    .select("*, property:properties(name), requester:users(name)")
    .eq("contractor_id", user.contractorId)
    .order("requested_date", { ascending: false })
    .order("created_at", { ascending: false });

  const requests = (data as unknown as RequestRow[]) ?? [];

  const groups: Record<string, RequestRow[]> = { pending: [], approved: [], rejected: [] };
  for (const r of requests) groups[r.status]?.push(r);

  return (
    <div className="space-y-6">
      <PageHeader title="依頼管理" />

      {requests.length === 0 ? (
        <EmptyState>依頼はまだありません。</EmptyState>
      ) : (
        <div className="space-y-8">
          {(["pending", "approved", "rejected"] as const).map((status) => {
            const rows = groups[status];
            if (rows.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CHIP[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="text-zinc-400">{rows.length}件</span>
                </h2>
                <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rows.map((r) => {
                      const [, m, d] = r.requested_date.split("-");
                      return (
                        <li key={r.id}>
                          <Link
                            href={`/requests/${r.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {r.property?.name ?? "不明"}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {parseInt(m)}/{parseInt(d)}
                                {r.requested_start_time ? ` ${r.requested_start_time.slice(0, 5)}` : ""}
                                {" · "}{r.requester?.name ?? "不明"}
                              </p>
                            </div>
                            <span className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] ${STATUS_CHIP[r.status]}`}>
                              {STATUS_LABEL[r.status]}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
