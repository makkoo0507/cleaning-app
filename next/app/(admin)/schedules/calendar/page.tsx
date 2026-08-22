import { requireContractor, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Job, JobAssignee, Property, User } from "@/lib/database.types";
import { PageHeader } from "@/components/ui";
import { PrimaryLink } from "@/components/PrimaryLink";
import CalendarView, { type CalendarJob } from "./CalendarView";

export const dynamic = "force-dynamic";

export default async function ScheduleCalendarPage() {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const supabase = await createClient();

  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }, { data: assigneesData }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .order("scheduled_date")
        .order("scheduled_start_time"),
      supabase.from("properties").select("id, name"),
      supabase.from("users").select("id, name").eq("role", "cleaner"),
      supabase.from("job_assignees").select("*"),
    ]);

  const propMap = new Map(
    ((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [p.id, p.name])
  );
  const cleanerMap = new Map(
    ((cleanersData as Pick<User, "id" | "name">[]) ?? []).map((c) => [c.id, c.name])
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="スケジュール（カレンダー）"
        action={
          admin ? <PrimaryLink href="/schedules/new">+ 案件を作成</PrimaryLink> : null
        }
      />
      <CalendarView jobs={jobs} admin={admin} />
    </div>
  );
}
