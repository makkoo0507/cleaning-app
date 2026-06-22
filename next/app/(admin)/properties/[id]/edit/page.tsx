import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/database.types";
import { updateProperty } from "../../actions";
import PropertyForm from "../../PropertyForm";
import { PageHeader } from "@/components/ui";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single<Property>();

  if (!data) notFound();

  const action = updateProperty.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="物件を編集" />
      <PropertyForm action={action} property={data} />
    </div>
  );
}
