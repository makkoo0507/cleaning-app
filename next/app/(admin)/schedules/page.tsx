import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CleaningRequest, Job, JobAssignee, Property, User } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import { PrimaryLink } from "@/components/PrimaryLink";
import CalendarView, { type CalendarJob, type CalendarRequest } from "./calendar/CalendarView";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const supabase = await createClient();

  const adminClient = createAdminClient();

  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }, requestsResult, { data: contactsData }, { data: assigneesData }] =
    await Promise.all([
      supabase.from("jobs").select("*").order("scheduled_date").order("scheduled_start_time"),
      supabase.from("properties").select("id, name"),
      supabase.from("users").select("id, name").eq("role", "cleaner"),
      adminClient
        .from("cleaning_requests")
        .select("*")
        .eq("contractor_id", user.contractorId)
        .in("status", ["pending", "rejected"])
        .order("requested_date"),
      supabase.from("users").select("id, name").eq("role", "contact"),
      supabase.from("job_assignees").select("*"),
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

  const assigneesByJob = new Map<string, JobAssignee[]>();
  for (const a of (assigneesData as JobAssignee[]) ?? []) {
    const arr = assigneesByJob.get(a.job_id) ?? [];
    arr.push(a);
    assigneesByJob.set(a.job_id, arr);
  }

  const jobs: CalendarJob[] = ((jobsData as Job[]) ?? []).map((j) => {
    const jobAssignees = (assigneesByJob.get(j.id) ?? []).sort((a, b) => a.slot - b.slot);
    const cleanerNames = jobAssignees.map((a) => cleanerMap.get(a.cleaner_id) ?? "不明");
    const totalPayment = jobAssignees.reduce((sum, a) => sum + (a.payment_amount ?? 0), 0);
    return {
      id: j.id,
      scheduled_date: j.scheduled_date,
      scheduled_start_time: j.scheduled_start_time,
      status: j.status,
      propertyName: propMap.get(j.property_id) ?? "不明",
      cleanerName: cleanerNames.length > 0 ? cleanerNames.join("、") : null,
      billingAmount: j.billing_amount,
      paymentAmount: jobAssignees.some((a) => a.payment_amount != null) ? totalPayment : null,
      source: (j.source ?? "manual") as "manual" | "ical",
    };
  });

  const requests: CalendarRequest[] = ((requestsData as CleaningRequest[]) ?? []).map((r) => ({
    id: r.id,
    scheduled_date: r.requested_date,
    scheduled_start_time: r.requested_start_time,
    propertyName: propMap.get(r.property_id) ?? "不明",
    requesterName: contactMap.get(r.requested_by) ?? "不明",
    note: r.note,
    status: r.status as "pending" | "rejected",
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
