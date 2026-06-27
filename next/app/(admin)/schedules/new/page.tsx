import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Property, User } from "@/lib/database.types";
import { createJob } from "../actions";
import JobForm from "../JobForm";
import { PageHeader } from "@/components/ui";

export default async function NewSchedulePage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: propsData }, { data: cleanersData }] = await Promise.all([
    supabase.from("properties").select("id, name, default_billing_amount, default_payment_amount").order("name"),
    supabase.from("users").select("id, name").eq("role", "cleaner").order("name"),
  ]);

  type PropRow = Pick<Property, "id" | "name" | "default_billing_amount" | "default_payment_amount">;
  const properties = (propsData as PropRow[]) ?? [];
  const propertyDefaults = Object.fromEntries(
    properties.map((p) => [
      p.id,
      { billing: p.default_billing_amount, payment: p.default_payment_amount },
    ])
  );

  return (
    <div className="space-y-6">
      <PageHeader title="案件を作成" />
      <JobForm
        action={createJob}
        properties={properties}
        cleaners={(cleanersData as Pick<User, "id" | "name">[]) ?? []}
        propertyDefaults={propertyDefaults}
      />
    </div>
  );
}
