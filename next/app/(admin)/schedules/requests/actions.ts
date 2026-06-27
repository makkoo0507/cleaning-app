"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function rejectRequest(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("cleaning_requests")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);

  // オーナーへ LINE 通知
  notifyRequestRejected(id, reason).catch(() => {});

  revalidatePath("/schedules");
}

async function notifyRequestRejected(requestId: string, reason: string | null) {
  const admin = createAdminClient();

  const { data: req } = await admin
    .from("cleaning_requests")
    .select(
      "requested_date, note, requested_by, contractor_id, properties(name), contractors(line_channel_access_token)"
    )
    .eq("id", requestId)
    .single<{
      requested_date: string;
      note: string | null;
      requested_by: string;
      contractor_id: string;
      properties: { name: string } | null;
      contractors: { line_channel_access_token: string | null } | null;
    }>();

  const token = req?.contractors?.line_channel_access_token;
  if (!req || !token) return;

  const { data: requester } = await admin
    .from("users")
    .select("line_user_id")
    .eq("id", req.requested_by)
    .single<{ line_user_id: string | null }>();

  if (!requester?.line_user_id) return;

  const propertyName = req.properties?.name ?? "";
  const date = req.requested_date;
  let text = `${propertyName}（${date}）の清掃依頼が却下されました。`;
  if (reason) text += `\n\n理由：${reason}`;

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: requester.line_user_id,
      messages: [{ type: "text", text }],
    }),
  });
}
