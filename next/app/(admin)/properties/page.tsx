import Link from "next/link";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/database.types";
import { deleteProperty } from "./actions";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  await requireContractor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  const properties = (data as Property[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="物件管理"
        action={<PrimaryLink href="/properties/new">+ 物件を登録</PrimaryLink>}
      />

      {properties.length === 0 ? (
        <EmptyState>物件がまだ登録されていません。</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">物件名</th>
                <th className="px-4 py-3 font-medium">住所</th>
                <th className="px-4 py-3 font-medium">特記事項</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {properties.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.address}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                    {p.notes ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/properties/${p.id}/edit`}
                      className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      編集
                    </Link>
                    <form action={deleteProperty} className="ml-3 inline">
                      <input type="hidden" name="id" value={p.id} />
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
