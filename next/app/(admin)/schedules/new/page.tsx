import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getContractorFlags } from "@/lib/company";
import type { Property, User } from "@/lib/database.types";
import { createJob } from "../actions";
import JobForm from "../JobForm";
import { PageHeader } from "@/components/ui";

export default async function NewSchedulePage() {
  const admin = await requireAdmin();
  const { billingEnabled } = await getContractorFlags(admin.contractorId);
  const supabase = await createClient();
  const [{ data: propsData }, { data: cleanersData }] = await Promise.all([
    supabase.from("properties").select("id, name").order("name"),
    supabase.from("users").select("id, name").eq("role", "cleaner").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="案件を作成" />
      <JobForm
        action={createJob}
        properties={(propsData as Pick<Property, "id" | "name">[]) ?? []}
        cleaners={(cleanersData as Pick<User, "id" | "name">[]) ?? []}
        billingEnabled={billingEnabled}
      />
    </div>
  );
}
