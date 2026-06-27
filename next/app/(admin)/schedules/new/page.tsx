import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CleaningRequest, Property, User } from "@/lib/database.types";
import { createJob } from "../actions";
import JobForm from "../JobForm";
import { PageHeader } from "@/components/ui";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string }>;
}) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { request_id } = await searchParams;

  const [{ data: propsData }, { data: cleanersData }] = await Promise.all([
    supabase.from("properties").select("id, name, default_billing_amount, default_payment_amount, default_start_time").order("name"),
    supabase.from("users").select("id, name").eq("role", "cleaner").order("name"),
  ]);

  type PropRow = Pick<Property, "id" | "name" | "default_billing_amount" | "default_payment_amount" | "default_start_time">;
  const properties = (propsData as PropRow[]) ?? [];
  const propertyDefaults = Object.fromEntries(
    properties.map((p) => [
      p.id,
      { billing: p.default_billing_amount, payment: p.default_payment_amount, startTime: p.default_start_time },
    ])
  );

  // 依頼からのプリフィル
  let requestPreset: {
    request_id: string;
    property_id: string;
    scheduled_date: string;
    scheduled_start_time: string | null;
  } | null = null;

  if (request_id) {
    const { data: req } = await supabase
      .from("cleaning_requests")
      .select("*")
      .eq("id", request_id)
      .single<CleaningRequest>();
    if (req) {
      requestPreset = {
        request_id: req.id,
        property_id: req.property_id,
        scheduled_date: req.requested_date,
        scheduled_start_time: req.requested_start_time,
      };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="案件を作成" />
      {requestPreset && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          依頼内容をもとにプリフィルしています。内容を確認・修正してから保存してください。
        </p>
      )}
      <JobForm
        action={createJob}
        properties={properties}
        cleaners={(cleanersData as Pick<User, "id" | "name">[]) ?? []}
        propertyDefaults={propertyDefaults}
        requestPreset={requestPreset}
      />
    </div>
  );
}
