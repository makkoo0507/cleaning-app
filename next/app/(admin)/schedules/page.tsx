import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Job, Property, User } from "@/lib/database.types";
import { PageHeader, PrimaryLink } from "@/components/ui";
import CalendarView, { type CalendarJob } from "./calendar/CalendarView";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const supabase = await createClient();

  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .order("scheduled_date")
        .order("scheduled_start_time"),
      supabase.from("properties").select("id, name"),
      supabase.from("users").select("id, name").eq("role", "cleaner"),
    ]);

  const propMap = new Map(
    ((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [p.id, p.name])
  );
  const cleanerMap = new Map(
    ((cleanersData as Pick<User, "id" | "name">[]) ?? []).map((c) => [c.id, c.name])
  );

  const jobs: CalendarJob[] = ((jobsData as Job[]) ?? []).map((j) => ({
    id: j.id,
    scheduled_date: j.scheduled_date,
    scheduled_start_time: j.scheduled_start_time,
    status: j.status,
    propertyName: propMap.get(j.property_id) ?? "不明",
    cleanerName: j.cleaner_id ? (cleanerMap.get(j.cleaner_id) ?? null) : null,
    billingAmount: j.billing_amount,
    paymentAmount: j.payment_amount,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="スケジュール"
        action={
          admin ? <PrimaryLink href="/schedules/new">+ 案件を作成</PrimaryLink> : null
        }
      />
      <CalendarView jobs={jobs} defaultView="agenda" admin={admin} />
    </div>
  );
}
