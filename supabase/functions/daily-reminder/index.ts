// 定期リマインド Edge Function
// pg_cron から日次で呼び出される。kind で前日/当日を切り替える。
//   - kind=prev_day : 翌日の案件をリマインド（前日の夜に実行する想定）
//   - kind=same_day : 当日の案件をリマインド（当日の朝に実行する想定）
// 送信先・タイミングは contractor_notification_settings に従う。
// reminder_logs(job_id, kind) のユニーク制約で重複送信を防止する。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Kind = "prev_day" | "same_day";
type Recipient = "cleaner" | "owner";

interface ContractorCache {
  line_channel_access_token: string | null;
  notifyMap: Map<`${Recipient}:${Kind}`, boolean>;
}

Deno.serve(async (req) => {
  // kind の決定（クエリ → ボディ → 既定 prev_day）
  let kind = new URL(req.url).searchParams.get("kind") as Kind | null;
  if (kind !== "prev_day" && kind !== "same_day") {
    try {
      const body = await req.json();
      if (body?.kind === "prev_day" || body?.kind === "same_day") kind = body.kind;
    } catch {
      // body なし
    }
  }
  if (kind !== "prev_day" && kind !== "same_day") kind = "prev_day";

  const trigger = kind === "prev_day" ? "reminder_prev_day" : "reminder_same_day";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 対象日（JST）: 前日リマインド=翌日、当日リマインド=本日
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const target = new Date(jst);
  if (kind === "prev_day") target.setUTCDate(jst.getUTCDate() + 1);
  const targetStr = target.toISOString().slice(0, 10);

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, scheduled_date, scheduled_start_time, cleaner_id, property_id, contractor_id")
    .eq("scheduled_date", targetStr)
    .eq("status", "scheduled");

  if (error) {
    console.error("Failed to fetch jobs:", error.message);
    return new Response("error", { status: 500 });
  }
  if (!jobs || jobs.length === 0) {
    return new Response(`ok: no jobs (${kind} ${targetStr})`);
  }

  const contractorCache = new Map<string, ContractorCache | null>();

  async function getContractor(id: string): Promise<ContractorCache | null> {
    if (contractorCache.has(id)) return contractorCache.get(id)!;

    const [{ data: c }, { data: ns }] = await Promise.all([
      supabase
        .from("contractors")
        .select("line_channel_access_token")
        .eq("id", id)
        .single(),
      supabase
        .from("contractor_notification_settings")
        .select("recipient, trigger, enabled")
        .eq("contractor_id", id),
    ]);

    if (!c) { contractorCache.set(id, null); return null; }

    const notifyMap = new Map<`${Recipient}:${Kind}`, boolean>();
    for (const row of ns ?? []) {
      if (row.trigger === "reminder_prev_day" || row.trigger === "reminder_same_day") {
        const k = row.trigger === "reminder_prev_day" ? "prev_day" : "same_day";
        notifyMap.set(`${row.recipient}:${k}`, row.enabled);
      }
    }
    const result: ContractorCache = { line_channel_access_token: c.line_channel_access_token, notifyMap };
    contractorCache.set(id, result);
    return result;
  }

  let sent = 0;

  for (const job of jobs) {
    const contractor = await getContractor(job.contractor_id);
    if (!contractor?.line_channel_access_token) continue;

    const sendCleaner = contractor.notifyMap.get(`cleaner:${kind}`) ?? false;
    const sendOwner   = contractor.notifyMap.get(`owner:${kind}`)   ?? false;
    if (!sendCleaner && !sendOwner) continue;

    // 重複送信防止: (job_id, kind) を先に確保。既に存在ならスキップ。
    const { error: claimErr } = await supabase
      .from("reminder_logs")
      .insert({ job_id: job.id, kind });
    if (claimErr) continue;

    const token = contractor.line_channel_access_token;

    const { data: prop } = await supabase
      .from("properties")
      .select("name")
      .eq("id", job.property_id)
      .single();
    const propertyName = prop?.name ?? "";
    const [, m, d] = job.scheduled_date.split("-").map(Number);
    const time = job.scheduled_start_time
      ? ` ${job.scheduled_start_time.slice(0, 5)}`
      : "";
    const whenWord = kind === "prev_day" ? `明日 ${m}/${d}` : `本日 ${m}/${d}`;
    const text = `${whenWord}${time} ${propertyName}の清掃があります。`;

    const recipients: string[] = [];

    // 清掃者
    if (sendCleaner && job.cleaner_id) {
      const { data: cleaner } = await supabase
        .from("users")
        .select("line_user_id")
        .eq("id", job.cleaner_id)
        .single();
      if (cleaner?.line_user_id) recipients.push(cleaner.line_user_id);
    }

    // オーナー（通知ONの物件関係者）
    if (sendOwner) {
      const { data: members } = await supabase
        .from("property_members")
        .select("user_id")
        .eq("property_id", job.property_id)
        .eq("notify", true);
      const ids = (members ?? []).map((x: { user_id: string }) => x.user_id);
      if (ids.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("line_user_id")
          .in("id", ids)
          .not("line_user_id", "is", null);
        for (const u of users ?? []) {
          if (u.line_user_id) recipients.push(u.line_user_id);
        }
      }
    }

    await Promise.allSettled(
      recipients.map((to) =>
        fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
        })
      )
    );
    sent += recipients.length;
  }

  console.log(`daily-reminder(${trigger} ${targetStr}): sent ${sent}`);
  return new Response(`ok: ${sent} sent (${trigger} ${targetStr})`);
});
