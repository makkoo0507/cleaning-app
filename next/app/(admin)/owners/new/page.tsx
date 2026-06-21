import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/database.types";
import { createOwner } from "../actions";
import OwnerForm from "../OwnerForm";
import { PageHeader } from "@/components/ui";

export default async function NewOwnerPage() {
  await requireContractor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, name")
    .order("name");
  const properties = (data as Pick<Property, "id" | "name">[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="物件関係者を登録" />
      <p className="text-sm text-zinc-500">
        登録後、一覧から招待 URL を発行して本人に送付してください。
      </p>
      <OwnerForm action={createOwner} properties={properties} />
    </div>
  );
}
