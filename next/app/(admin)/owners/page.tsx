import Link from "next/link";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyMember, User } from "@/lib/database.types";
import { PROPERTY_MEMBER_ROLE_LABEL } from "@/lib/database.types";
import { deleteOwner } from "./actions";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/ui";
import InviteLink from "@/components/InviteLink";

export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  await requireContractor();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("role", "contact")
    .order("created_at", { ascending: false });
  const owners = (users as User[]) ?? [];

  const [{ data: membersData }, { data: propsData }] = await Promise.all([
    supabase.from("property_members").select("*"),
    supabase.from("properties").select("id, name"),
  ]);
  const propMap = new Map(
    ((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [
      p.id,
      p.name,
    ])
  );
  const membersByUser = new Map<string, PropertyMember[]>();
  for (const m of (membersData as PropertyMember[]) ?? []) {
    const arr = membersByUser.get(m.user_id) ?? [];
    arr.push(m);
    membersByUser.set(m.user_id, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="オーナー管理"
        action={<PrimaryLink href="/owners/new">+ 関係者を登録</PrimaryLink>}
      />

      {owners.length === 0 ? (
        <EmptyState>物件関係者がまだ登録されていません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">担当物件</th>
                <th className="px-4 py-3 font-medium">LINE紐付け</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {owners.map((o) => {
                const members = membersByUser.get(o.id) ?? [];
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {o.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {members.length === 0
                        ? "—"
                        : members
                            .map(
                              (m) =>
                                `${propMap.get(m.property_id) ?? "?"}（${
                                  PROPERTY_MEMBER_ROLE_LABEL[m.role] ?? m.role
                                }${m.notify ? "・通知" : ""}）`
                            )
                            .join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <InviteLink
                        token={o.invite_token}
                        liffId={process.env.NEXT_PUBLIC_LIFF_ID}
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/owners/${o.id}/edit`}
                        className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        編集
                      </Link>
                      <form action={deleteOwner} className="ml-3 inline">
                        <input type="hidden" name="id" value={o.id} />
                        <button
                          type="submit"
                          className="text-red-600 underline hover:text-red-800"
                        >
                          削除
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
