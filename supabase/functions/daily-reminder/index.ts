// 前日リマインド Edge Function
// pg_cron から毎日 20:00 JST（= 11:00 UTC）に呼び出される
// 翌日の清掃案件を持つ清掃者に LINE リマインドを送信する
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 翌日の日付（JST 基準）
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const tomorrow = new Date(jst);
  tomorrow.setUTCDate(jst.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // 翌日の案件を取得（清掃者アサイン済みのもののみ）
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, scheduled_date, scheduled_start_time, cleaner_id, property_id"
    )
    .eq("scheduled_date", tomorrowStr)
    .eq("status", "scheduled")
    .not("cleaner_id", "is", null);

  if (error) {
    console.error("Failed to fetch jobs:", error.message);
    return new Response("error", { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return new Response("ok: no jobs tomorrow");
  }

  let sent = 0;

  await Promise.allSettled(
    jobs.map(async (job) => {
      // 清掃者の LINE user ID を取得
      const { data: cleaner } = await supabase
        .from("users")
        .select("line_user_id")
        .eq("id", job.cleaner_id)
        .single();

      if (!cleaner?.line_user_id) return;

      // 業者の LINE チャネルアクセストークンを取得
      const { data: jobWithCompany } = await supabase
        .from("jobs")
        .select("contractor_companies(line_channel_access_token), properties(name)")
        .eq("id", job.id)
        .single();

      const token = (jobWithCompany as any)?.contractor_companies
        ?.line_channel_access_token;
      if (!token) return;

      const propertyName = (jobWithCompany as any)?.properties?.name ?? "";
      const [, m, d] = job.scheduled_date.split("-").map(Number);
      const time = job.scheduled_start_time
        ? ` ${job.scheduled_start_time.slice(0, 5)}`
        : "";
      const text = `明日 ${m}/${d}${time} ${propertyName}の清掃があります。`;

      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: cleaner.line_user_id,
          messages: [{ type: "text", text }],
        }),
      });

      sent++;
    })
  );

  console.log(`daily-reminder: sent ${sent}/${jobs.length} reminders for ${tomorrowStr}`);
  return new Response(`ok: ${sent} reminders sent`);
});
