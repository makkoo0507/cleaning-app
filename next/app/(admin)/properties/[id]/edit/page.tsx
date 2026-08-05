import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { IcalFeed, Property } from "@/lib/database.types";
import { updateProperty } from "../../actions";
import PropertyForm from "../../PropertyForm";
import { PageHeader } from "@/components/ui";
import { CreatedBanner } from "@/components/CreatedBanner";
import IcalFeedSection from "./IcalFeedSection";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const [{ data }, { data: feeds }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).single<Property>(),
    supabase.from("ical_feeds").select("*").eq("property_id", id).order("created_at"),
  ]);

  if (!data) notFound();

  const action = updateProperty.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="物件を編集" />
      <CreatedBanner />
      <PropertyForm action={action} property={data} />
      <hr className="border-zinc-200 dark:border-zinc-800" />
      <IcalFeedSection propertyId={id} feeds={(feeds as IcalFeed[]) ?? []} />
    </div>
  );
}
