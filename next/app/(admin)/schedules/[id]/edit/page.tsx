import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyFlags } from "@/lib/company";
import type { Job, Property, User } from "@/lib/database.types";
import { updateJob } from "../../actions";
import JobForm from "../../JobForm";
import { PageHeader } from "@/components/ui";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { billingEnabled } = await getCompanyFlags(admin.companyId);
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single<Job>();
  if (!job) notFound();

  const [{ data: propsData }, { data: cleanersData }] = await Promise.all([
    supabase.from("properties").select("id, name").order("name"),
    supabase.from("users").select("id, name").eq("role", "cleaner").order("name"),
  ]);

  const action = updateJob.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="案件を編集" />
      <JobForm
        action={action}
        job={job}
        properties={(propsData as Pick<Property, "id" | "name">[]) ?? []}
        cleaners={(cleanersData as Pick<User, "id" | "name">[]) ?? []}
        billingEnabled={billingEnabled}
      />
    </div>
  );
}
