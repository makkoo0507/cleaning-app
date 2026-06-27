import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ContractorMemberProfile, User } from "@/lib/database.types";
import { deleteStaff } from "./actions";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requireAdmin();
  const supabase = await createClient();

  // 管理者（自分含む）と閲覧者を一覧に表示（role 昇順で管理者→閲覧者）
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in("role", ["contractor_admin", "contractor_viewer"])
    .order("role", { ascending: true })
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
        title="ユーザー管理"
        action={<PrimaryLink href="/staff/new">+ ユーザーを登録</PrimaryLink>}
      />
      <p className="text-sm text-zinc-500">
        管理者と閲覧者の一覧です。管理者はすべての操作（作成・編集・削除）が可能です。
        閲覧者はすべての画面を閲覧できますが、作成・編集・削除はできません。
      </p>

      {staff.length === 0 ? (
        <EmptyState>ユーザーがまだ登録されていません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">権限</th>
                <th className="px-4 py-3 font-medium">メール</th>
                <th className="px-4 py-3 font-medium">部署</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {staff.map((s) => {
                const isAdminRow = s.role === "contractor_admin";
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {s.name}
                      {s.id === me.id && (
                        <span className="ml-2 text-xs text-zinc-400">（自分）</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {isAdminRow ? "管理者" : "閲覧者"}
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
                      {/* 管理者（自分含む）は社員管理からは削除不可 */}
                      {!isAdminRow && (
                        <DeleteButton
                          action={deleteStaff}
                          id={s.id}
                          name={s.name}
                          className="ml-3 text-red-600 underline hover:text-red-800"
                        />
                      )}
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
