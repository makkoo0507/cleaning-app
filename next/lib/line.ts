// LINE Messaging API ユーティリティ（サーバー専用）
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateShort, formatDateTime, formatDuration } from "@/lib/format";

type AdminClient = ReturnType<typeof createAdminClient>;

interface JobNotifyRow {
  scheduled_date: string;
  company_id: string;
  property_id: string;
  cleaner_id: string | null;
  properties: { name: string } | null;
  contractors: { line_channel_access_token: string | null } | null;
}

// --- 基本送信 ---

async function push(
  token: string,
  lineUserId: string,
  text: string
): Promise<void> {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });
}

async function pushAll(
  token: string,
  lineUserIds: string[],
  text: string
): Promise<void> {
  if (lineUserIds.length === 0) return;
  await Promise.allSettled(lineUserIds.map((id) => push(token, id, text)));
}

// --- 通知関数 ---

// スケジュール作成時：清掃者 + 通知有効な物件関係者へ通知
export async function notifyScheduleCreated(jobId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select(
      "scheduled_date, company_id, property_id, cleaner_id, properties(name), contractors(line_channel_access_token)"
    )
    .eq("id", jobId)
    .single<JobNotifyRow>();

  // LINE トークン未設定の業者はスキップ
  const token = job?.contractors?.line_channel_access_token;
  if (!job || !token) return;

  const date = formatDateShort(job.scheduled_date);
  const propertyName = job.properties?.name ?? "";
  // LIFF は単一アプリ（エンドポイント /liff）。役割別画面へはパスを付与して開く。
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const cleanerUrl = liffId
    ? `\nhttps://liff.line.me/${liffId}/cleaner/schedules`
    : "";
  const ownerUrl = liffId
    ? `\nhttps://liff.line.me/${liffId}/owner/schedules`
    : "";

  // 清掃者への通知
  if (job.cleaner_id) {
    const { data: cleaner } = await admin
      .from("users")
      .select("line_user_id")
      .eq("id", job.cleaner_id)
      .single<{ line_user_id: string | null }>();
    if (cleaner?.line_user_id) {
      await push(
        token,
        cleaner.line_user_id,
        `${date} ${propertyName}の清掃が入りました${cleanerUrl}`
      ).catch(() => {});
    }
  }

  // 通知有効な物件関係者への通知
  const contactIds = await getNotifiableLineIds(admin, job.property_id);
  await pushAll(
    token,
    contactIds,
    `${date}に${propertyName}の清掃が予定されました${ownerUrl}`
  );
}

// 清掃完了時：通知有効な物件関係者 + 業者スタッフへ通知
export async function notifyCleaningCompleted(jobId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select(
      "scheduled_date, company_id, property_id, cleaner_id, properties(name), contractors(line_channel_access_token)"
    )
    .eq("id", jobId)
    .single<JobNotifyRow>();

  const token = job?.contractors?.line_channel_access_token;
  if (!job || !token) return;

  const propertyName = job.properties?.name ?? "";

  // 清掃記録を取得
  const { data: record } = await admin
    .from("cleaning_records")
    .select("completed_at, duration_minutes")
    .eq("job_id", jobId)
    .single<{ completed_at: string | null; duration_minutes: number | null }>();

  const detail = record?.completed_at
    ? `\n完了時刻: ${formatDateTime(record.completed_at)}\n所要時間: ${formatDuration(record.duration_minutes)}`
    : "";

  // 物件関係者への通知
  const contactIds = await getNotifiableLineIds(admin, job.property_id);
  await pushAll(token, contactIds, `${propertyName}の清掃が完了しました${detail}`);

  // 業者スタッフへの通知
  let cleanerName = "担当者";
  if (job.cleaner_id) {
    const { data: cleaner } = await admin
      .from("users")
      .select("name")
      .eq("id", job.cleaner_id)
      .single<{ name: string }>();
    cleanerName = cleaner?.name ?? cleanerName;
  }

  const { data: staff } = await admin
    .from("users")
    .select("line_user_id")
    .eq("company_id", job.company_id)
    .in("role", ["contractor_admin", "contractor_viewer"])
    .not("line_user_id", "is", null)
    .returns<{ line_user_id: string | null }[]>();

  const staffIds = (staff ?? [])
    .map((s) => s.line_user_id)
    .filter((id): id is string => Boolean(id));
  await pushAll(
    token,
    staffIds,
    `${cleanerName}が${propertyName}の清掃を完了しました${detail}`
  );
}

// --- 内部ヘルパー ---

async function getNotifiableLineIds(
  admin: AdminClient,
  propertyId: string
): Promise<string[]> {
  const { data: members } = await admin
    .from("property_members")
    .select("user_id")
    .eq("property_id", propertyId)
    .eq("notify", true)
    .returns<{ user_id: string }[]>();

  if (!members || members.length === 0) return [];

  const { data: users } = await admin
    .from("users")
    .select("line_user_id")
    .in(
      "id",
      members.map((m) => m.user_id)
    )
    .not("line_user_id", "is", null)
    .returns<{ line_user_id: string | null }[]>();

  return (users ?? [])
    .map((u) => u.line_user_id)
    .filter((id): id is string => Boolean(id));
}
