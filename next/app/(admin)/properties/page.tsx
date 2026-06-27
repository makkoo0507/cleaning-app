import Link from "next/link";
import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/database.types";
import { deleteProperty } from "./actions";
import { PageHeader, PrimaryLink, EmptyState } from "@/components/ui";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const admin = isAdmin(await requireContractor());
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
        action={
          admin ? (
            <PrimaryLink href="/properties/new">+ 物件を登録</PrimaryLink>
          ) : null
        }
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
                {admin && <th className="px-4 py-3" />}
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
                  {admin && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/properties/${p.id}/edit`}
                        className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        編集
                      </Link>
                      <DeleteButton
                        action={deleteProperty}
                        id={p.id}
                        name={p.name}
                        className="ml-3 text-red-600 underline hover:text-red-800"
                      />
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
