import Link from "next/link";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CleanerProfile, User } from "@/lib/database.types";
import { deleteCleaner } from "./actions";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/ui";
import InviteLink from "@/components/InviteLink";

export const dynamic = "force-dynamic";

export default async function CleanersPage() {
  await requireContractor();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("role", "cleaner")
    .order("created_at", { ascending: false });

  const cleaners = (users as User[]) ?? [];

  const { data: profilesData } = await supabase
    .from("cleaner_profiles")
    .select("*");
  const profiles = new Map(
    ((profilesData as CleanerProfile[]) ?? []).map((p) => [p.user_id, p])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="清掃者管理"
        action={<PrimaryLink href="/cleaners/new">+ 清掃者を登録</PrimaryLink>}
      />

      {cleaners.length === 0 ? (
        <EmptyState>清掃者がまだ登録されていません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">得意分野</th>
                <th className="px-4 py-3 font-medium">LINE紐付け</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {cleaners.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {profiles.get(c.id)?.skills ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <InviteLink
                      token={c.invite_token}
                      liffId={process.env.NEXT_PUBLIC_LIFF_ID_CLEANER}
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/cleaners/${c.id}/edit`}
                      className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      編集
                    </Link>
                    <form action={deleteCleaner} className="ml-3 inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-red-600 underline hover:text-red-800"
                      >
                        削除
                      </button>
                    </form>
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
