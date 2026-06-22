"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyScheduleCreated } from "@/lib/line";
import type { JobStatus } from "@/lib/database.types";

export interface JobFormState {
  error?: string;
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

  if (!f.propertyId || !f.scheduledDate) {
    return { error: "物件と清掃日は必須です。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      company_id: user.companyId,
      property_id: f.propertyId,
      cleaner_id: f.cleanerId,
      scheduled_date: f.scheduledDate,
      scheduled_start_time: f.startTime,
      status: f.status,
      billing_amount: f.billingAmount,
      payment_amount: f.paymentAmount,
    })
    .select("id")
    .single();

  if (error) return { error: "作成に失敗しました。" };

  // スケジュール作成通知（LINE 未設定・エラーは無視）
  if (data?.id) {
    notifyScheduleCreated(data.id).catch(() => {});
  }

  revalidatePath("/schedules");
  redirect("/schedules");
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
  redirect(`/schedules/${id}`);
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
