import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ContractorMemberProfile, User } from "@/lib/database.types";
import { deleteStaff } from "./actions";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requireAdmin();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("role", "contractor_staff")
    .order("created_at", { ascending: false });
  const staff = (users as User[]) ?? [];

  const { data: profilesData } = await supabase
    .from("contractor_member_profiles")
    .select("*");
  const profiles = new Map(
    ((profilesData as ContractorMemberProfile[]) ?? []).map((p) => [
      p.user_id,
      p,
    ])
  );

  // email は auth.users 側にあるため service role で取得
  const adminClient = createAdminClient();
  const { data: authList } = await adminClient.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailMap = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="社員管理"
        action={<PrimaryLink href="/staff/new">+ 社員を登録</PrimaryLink>}
      />
      <p className="text-sm text-zinc-500">
        社員はスケジュール管理・清掃記録の閲覧が可能です（請求管理・ユーザー管理は閲覧のみ）。
      </p>

      {staff.length === 0 ? (
        <EmptyState>社員がまだ登録されていません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">メール</th>
                <th className="px-4 py-3 font-medium">部署</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {emailMap.get(s.id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {profiles.get(s.id)?.department ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/staff/${s.id}/edit`}
                      className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      編集
                    </Link>
                    {s.id !== me.id && (
                      <form action={deleteStaff} className="ml-3 inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-red-600 underline hover:text-red-800"
                        >
                          削除
                        </button>
                      </form>
                    )}
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
