// iCal 同期 Edge Function
// pg_cron から 1 時間ごと、または管理画面の手動同期ボタンから呼び出される。
// 全 ical_feeds を取得し、各フィードの予約を ical_bookings に upsert。
// 新規予約は jobs に自動作成、2 回連続で消えた予約は jobs を cancelled にする。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface IcalEvent {
  uid: string;
  dtstart: string; // YYYY-MM-DD
  dtend: string;   // YYYY-MM-DD
  summary: string | null;
}

// テキスト形式の .ics をパースして VEVENT 一覧を返す
function parseIcal(text: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  // 折り返し行（行頭スペース/タブ）を結合
  const normalized = text.replace(/\r\n[ \t]/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const uid     = extractProp(block, "UID");
    const dtstart = extractDate(block, "DTSTART");
    const dtend   = extractDate(block, "DTEND");
    const summary = extractProp(block, "SUMMARY");

    if (!uid || !dtstart || !dtend) continue;
    events.push({ uid, dtstart, summary: summary ?? null, dtend });
  }
  return events;
}

function extractProp(block: string, key: string): string | null {
  // KEY: または KEY;... : の形式に対応
  const match = block.match(new RegExp(`^${key}[;:][^\n]*:?([^\n]+)`, "m"));
  if (!match) return null;
  // KEY:value と KEY;PARAM=VAL:value を両方処理
  const line = match[0];
  const colonIdx = line.indexOf(":");
  return colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : null;
}

function extractDate(block: string, key: string): string | null {
  // DTSTART;VALUE=DATE:20250715 または DTSTART:20250715 または DTSTART:20250715T150000Z
  const match = block.match(new RegExp(`^${key}[;:][^\n]*?:(\\d{8})`, "m"));
  if (!match) return null;
  const raw = match[1]; // YYYYMMDD
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function today(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  // property_id 指定があればそのフィードのみ同期（手動同期ボタン用）
  let filterPropertyId: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      filterPropertyId = body?.property_id ?? null;
    } catch { /* body なし */ }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let feedsQuery = supabase.from("ical_feeds").select("*");
  if (filterPropertyId) feedsQuery = feedsQuery.eq("property_id", filterPropertyId);
  const { data: feeds, error: feedsError } = await feedsQuery;

  if (feedsError) {
    console.error("Failed to fetch feeds:", feedsError.message);
    return new Response("error", { status: 500 });
  }
  if (!feeds || feeds.length === 0) {
    return new Response("ok: no feeds");
  }

  const todayStr = today();
  let totalCreated = 0;
  let totalCancelled = 0;

  for (const feed of feeds) {
    let icsText: string;
    try {
      const res = await fetch(feed.url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      icsText = await res.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("ical_feeds").update({ last_error: msg }).eq("id", feed.id);
      console.error(`Feed ${feed.id} fetch error:`, msg);
      continue;
    }

    const events = parseIcal(icsText);
    // 今日以降のイベントのみ対象
    const futureEvents = events.filter((e) => e.dtend >= todayStr);
    const currentUids = new Set(futureEvents.map((e) => e.uid));

    // 既存の ical_bookings を取得
    const { data: existing } = await supabase
      .from("ical_bookings")
      .select("*")
      .eq("feed_id", feed.id);

    const existingMap = new Map((existing ?? []).map((b: { uid: string; id: string; missing_count: number; dtend: string }) => [b.uid, b]));

    // upsert: 今回取得できたイベントを ical_bookings に反映
    if (futureEvents.length > 0) {
      await supabase.from("ical_bookings").upsert(
        futureEvents.map((e) => ({
          feed_id: feed.id,
          property_id: feed.property_id,
          uid: e.uid,
          dtstart: e.dtstart,
          dtend: e.dtend,
          summary: e.summary,
          missing_count: 0, // 再出現したらリセット
        })),
        { onConflict: "feed_id,uid" }
      );
    }

    // 新規予約: existing になく今回追加されたもの → jobs 作成
    for (const event of futureEvents) {
      if (existingMap.has(event.uid)) continue;

      const { data: booking } = await supabase
        .from("ical_bookings")
        .select("id")
        .eq("feed_id", feed.id)
        .eq("uid", event.uid)
        .single();

      if (!booking) continue;

      await supabase.from("jobs").insert({
        contractor_id: feed.contractor_id,
        property_id: feed.property_id,
        scheduled_date: event.dtend,
        status: "scheduled",
        source: "ical",
        ical_booking_id: booking.id,
      });
      totalCreated++;
    }

    // キャンセル検知: 既存にあるが今回のフィードから消えたもの
    for (const [uid, booking] of existingMap) {
      if (currentUids.has(uid)) continue;
      // 過去の清掃日は対象外
      if (booking.dtend < todayStr) continue;

      const newCount = (booking.missing_count ?? 0) + 1;
      await supabase
        .from("ical_bookings")
        .update({ missing_count: newCount })
        .eq("id", booking.id);

      if (newCount >= 2) {
        await supabase
          .from("jobs")
          .update({ status: "cancelled" })
          .eq("ical_booking_id", booking.id)
          .neq("status", "completed");
        totalCancelled++;
      }
    }

    // 同期成功: last_error をクリア・last_synced_at を更新
    await supabase
      .from("ical_feeds")
      .update({ last_synced_at: new Date().toISOString(), last_error: null })
      .eq("id", feed.id);
  }

  const msg = `ok: ${totalCreated} jobs created, ${totalCancelled} cancelled`;
  console.log(`sync-ical: ${msg}`);
  return new Response(msg);
});
