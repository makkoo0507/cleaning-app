import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CleaningRequest, Job, Property, User } from "@/lib/database.types";
import { PageHeader, PrimaryLink } from "@/components/ui";
import CalendarView, { type CalendarJob, type CalendarRequest } from "./calendar/CalendarView";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const supabase = await createClient();

  const adminClient = createAdminClient();

  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }, requestsResult, { data: contactsData }] =
    await Promise.all([
      supabase.from("jobs").select("*").order("scheduled_date").order("scheduled_start_time"),
      supabase.from("properties").select("id, name"),
      supabase.from("users").select("id, name").eq("role", "cleaner"),
      adminClient
        .from("cleaning_requests")
        .select("*")
        .eq("contractor_id", user.contractorId)
        .eq("status", "pending")
        .order("requested_date"),
      supabase.from("users").select("id, name").eq("role", "contact"),
    ]);

  const { data: requestsData } = requestsResult;

  const propMap = new Map(
    ((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [p.id, p.name])
  );
  const cleanerMap = new Map(
    ((cleanersData as Pick<User, "id" | "name">[]) ?? []).map((c) => [c.id, c.name])
  );
  const contactMap = new Map(
    ((contactsData as Pick<User, "id" | "name">[]) ?? []).map((c) => [c.id, c.name])
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

  const requests: CalendarRequest[] = ((requestsData as CleaningRequest[]) ?? []).map((r) => ({
    id: r.id,
    scheduled_date: r.requested_date,
    scheduled_start_time: r.requested_start_time,
    propertyName: propMap.get(r.property_id) ?? "不明",
    requesterName: contactMap.get(r.requested_by) ?? "不明",
    note: r.note,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="スケジュール"
        action={
          admin ? <PrimaryLink href="/schedules/new">+ 案件を作成</PrimaryLink> : null
        }
      />
      <CalendarView jobs={jobs} requests={requests} defaultView="agenda" admin={admin} />
    </div>
  );
}
