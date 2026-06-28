"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notifyScheduleCreated, sendOwnerReport } from "@/lib/line";
import type { JobStatus } from "@/lib/database.types";

export interface JobFormState {
  error?: string;
  success?: boolean;
}

const VALID_STATUS: JobStatus[] = ["scheduled", "in_progress", "completed"];

function parseForm(formData: FormData) {
  const propertyId = String(formData.get("property_id") ?? "");
  const cleanerId = String(formData.get("cleaner_id") ?? "") || null;
  const scheduledDate = String(formData.get("scheduled_date") ?? "");
  const startTime = String(formData.get("scheduled_start_time") ?? "") || null;
  const statusRaw = String(formData.get("status") ?? "scheduled");
  const status: JobStatus = VALID_STATUS.includes(statusRaw as JobStatus)
    ? (statusRaw as JobStatus)
    : "scheduled";
  const billing = formData.get("billing_amount");
  const payment = formData.get("payment_amount");
  return {
    propertyId,
    cleanerId,
    scheduledDate,
    startTime,
    status,
    billingAmount: billing ? Number(billing) : null,
    paymentAmount: payment ? Number(payment) : null,
  };
}

export async function createJob(
  _prev: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireAdmin();
  const f = parseForm(formData);
  const requestId = String(formData.get("request_id") ?? "") || null;

  if (!f.propertyId || !f.scheduledDate) {
    return { error: "物件と清掃日は必須です。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      contractor_id: user.contractorId,
      property_id: f.propertyId,
      cleaner_id: f.cleanerId,
      scheduled_date: f.scheduledDate,
      scheduled_start_time: f.startTime,
      status: f.status,
      billing_amount: f.billingAmount,
      payment_amount: f.paymentAmount,
      request_id: requestId,
    })
    .select("id")
    .single();

  if (error) return { error: "作成に失敗しました。" };

  // 依頼から作成した場合は承認済みに更新
  if (requestId && data?.id) {
    await supabase
      .from("cleaning_requests")
      .update({ status: "approved" })
      .eq("id", requestId);
  }

  // スケジュール作成通知（LINE 未設定・エラーは無視）
  if (data?.id) {
    notifyScheduleCreated(data.id).catch(() => {});
  }

  revalidatePath("/schedules");
  redirect(`/schedules/${data.id}?created=1`);
}

export async function updateJob(
  id: string,
  _prev: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  await requireAdmin();
  const f = parseForm(formData);

  if (!f.propertyId || !f.scheduledDate) {
    return { error: "物件と清掃日は必須です。" };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", id)
    .single<{ status: JobStatus }>();

  const { error } = await supabase
    .from("jobs")
    .update({
      property_id: f.propertyId,
      cleaner_id: f.cleanerId,
      scheduled_date: f.scheduledDate,
      scheduled_start_time: f.startTime,
      status: f.status,
      billing_amount: f.billingAmount,
      payment_amount: f.paymentAmount,
    })
    .eq("id", id);

  if (error) return { error: "更新に失敗しました。" };

  revalidatePath("/schedules");
  revalidatePath(`/schedules/${id}`);
  return { success: true };
}

export interface RecordFormState {
  error?: string;
  success?: boolean;
}

export async function upsertRecord(
  jobId: string,
  formData: FormData
): Promise<RecordFormState> {
  await requireAdmin();

  const startedAtLocal = String(formData.get("started_at") ?? "");
  const completedAtLocal = String(formData.get("completed_at") ?? "") || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  if (!startedAtLocal) return { error: "開始時刻は必須です。" };

  const startedAt = new Date(startedAtLocal + ":00+09:00").toISOString();
  const completedAt = completedAtLocal
    ? new Date(completedAtLocal + ":00+09:00").toISOString()
    : null;

  if (completedAt && completedAt < startedAt) {
    return { error: "完了時刻は開始時刻より後にしてください。" };
  }

  const durationMinutes =
    completedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("cleaning_records")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("cleaning_records")
      .update({ started_at: startedAt, completed_at: completedAt, duration_minutes: durationMinutes, memo })
      .eq("id", existing.id);
    if (error) return { error: "更新に失敗しました。" };
  } else {
    const { error } = await admin
      .from("cleaning_records")
      .insert({ job_id: jobId, started_at: startedAt, completed_at: completedAt, duration_minutes: durationMinutes, memo });
    if (error) return { error: "作成に失敗しました。" };
  }

  const { data: current } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single<{ status: JobStatus }>();

  const newStatus: JobStatus = completedAt ? "completed" : "in_progress";
  await supabase.from("jobs").update({ status: newStatus }).eq("id", jobId);

  revalidatePath(`/schedules/${jobId}`);
  return { success: true };
}

export async function deleteJob(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", id);
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function updateImageShare(imageId: string, share: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("cleaning_images")
    .update({ share_with_owner: share })
    .eq("id", imageId);
}

export async function deleteImage(imageId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: image } = await supabase
    .from("cleaning_images")
    .select("storage_path, job_id")
    .eq("id", imageId)
    .single<{ storage_path: string; job_id: string }>();

  if (image?.storage_path) {
    await createAdminClient()
      .storage.from("cleaning-images")
      .remove([image.storage_path]);
  }
  await supabase.from("cleaning_images").delete().eq("id", imageId);
  if (image?.job_id) revalidatePath(`/schedules/${image.job_id}`);
}

export interface ReportFormState {
  error?: string;
  success?: boolean;
}

export async function reportToOwner(
  jobId: string,
  _prev: ReportFormState,
  _formData: FormData
): Promise<ReportFormState> {
  await requireAdmin();
  try {
    await sendOwnerReport(jobId);
    const supabase = await createClient();
    await supabase
      .from("jobs")
      .update({ reported_at: new Date().toISOString() })
      .eq("id", jobId);
    revalidatePath(`/schedules/${jobId}`);
    return { success: true };
  } catch {
    return { error: "送信に失敗しました。" };
  }
}
