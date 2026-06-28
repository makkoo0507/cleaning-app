// 清掃記録の開始・完了登録（清掃者用）
// jobs.status 更新は RLS 上 cleaner が不可のため admin client を併用
// POST { action: "start", jobId } | { action: "complete", jobId, memo? }
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, jobId, memo } = body as {
    action: "start" | "complete" | "update_memo" | "revert_start" | "revert_complete";
    jobId: string;
    memo?: string;
  };

  if (!action || !jobId) {
    return NextResponse.json({ error: "action and jobId required" }, { status: 400 });
  }

  if (action === "revert_start") {
    const { data: j } = await supabase.from("jobs").select("id, status, cleaner_id").eq("id", jobId).single();
    if (!j || j.cleaner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (j.status !== "in_progress") return NextResponse.json({ error: "not_in_progress" }, { status: 409 });
    await supabase.from("cleaning_records").delete().eq("job_id", jobId);
    await createAdminClient().from("jobs").update({ status: "scheduled" }).eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  if (action === "revert_complete") {
    const { data: j } = await supabase.from("jobs").select("id, status, cleaner_id").eq("id", jobId).single();
    if (!j || j.cleaner_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (j.status !== "completed") return NextResponse.json({ error: "not_completed" }, { status: 409 });
    const { data: records } = await supabase.from("cleaning_records").select("id").eq("job_id", jobId).order("created_at", { ascending: false }).limit(1);
    if (records?.[0]) {
      await supabase.from("cleaning_records").update({ completed_at: null, duration_minutes: null }).eq("id", records[0].id);
    }
    await createAdminClient().from("jobs").update({ status: "in_progress" }).eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  // 担当確認（自分がアサインされた案件かつ RLS で同テナント）
  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, cleaner_id")
    .eq("id", jobId)
    .single();

  if (!job || job.cleaner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  if (action === "start") {
    if (job.status !== "scheduled") {
      return NextResponse.json({ error: "already_started" }, { status: 409 });
    }

    // 既存レコードがあれば重複挿入しない（管理者がステータスをリセットしたケース）
    const { data: existing } = await supabase
      .from("cleaning_records")
      .select("id")
      .eq("job_id", jobId)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from("cleaning_records")
        .insert({ job_id: jobId, started_at: new Date().toISOString() });

      if (error) {
        return NextResponse.json({ error: "insert_failed" }, { status: 500 });
      }
    }

    await admin.from("jobs").update({ status: "in_progress" }).eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    if (job.status !== "in_progress") {
      return NextResponse.json({ error: "not_in_progress" }, { status: 409 });
    }

    const completedAt = new Date().toISOString();

    // 複数行が存在しうるため最新1件を取得（.single() は複数行でnullになるため使わない）
    const { data: records } = await supabase
      .from("cleaning_records")
      .select("id, started_at")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1);

    const record = records?.[0] ?? null;

    if (record) {
      const durationMinutes = Math.round(
        (new Date(completedAt).getTime() - new Date(record.started_at).getTime()) / 60000
      );

      const { error } = await supabase
        .from("cleaning_records")
        .update({
          completed_at: completedAt,
          duration_minutes: durationMinutes,
          memo: memo?.trim() || null,
        })
        .eq("id", record.id);

      if (error) {
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
      }
    } else {
      // 開始記録がない場合（管理者がステータスを直接変更したケース）は完了のみ記録
      const { error } = await supabase
        .from("cleaning_records")
        .insert({
          job_id: jobId,
          started_at: completedAt,
          completed_at: completedAt,
          duration_minutes: 0,
          memo: memo?.trim() || null,
        });

      if (error) {
        return NextResponse.json({ error: "insert_failed" }, { status: 500 });
      }
    }

    await admin.from("jobs").update({ status: "completed" }).eq("id", jobId);

    return NextResponse.json({ ok: true });
  }

  if (action === "update_memo") {
    // 作業中・完了後のメモ更新（時刻は変更しない）
    const { data: records } = await supabase
      .from("cleaning_records")
      .select("id")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1);

    const record = records?.[0] ?? null;

    if (!record) {
      return NextResponse.json({ error: "record_not_found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("cleaning_records")
      .update({ memo: memo?.trim() || null })
      .eq("id", record.id);

    if (error) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
