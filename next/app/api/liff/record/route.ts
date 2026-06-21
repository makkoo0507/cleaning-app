// 清掃記録の開始・完了登録（清掃者用）
// jobs.status 更新は RLS 上 cleaner が不可のため admin client を併用
// POST { action: "start", jobId } | { action: "complete", jobId, memo? }
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notifyCleaningCompleted } from "@/lib/line";

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
    action: "start" | "complete";
    jobId: string;
    memo?: string;
  };

  if (!action || !jobId) {
    return NextResponse.json({ error: "action and jobId required" }, { status: 400 });
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

    const { error } = await supabase
      .from("cleaning_records")
      .insert({ job_id: jobId, started_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    await admin.from("jobs").update({ status: "in_progress" }).eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    if (job.status !== "in_progress") {
      return NextResponse.json({ error: "not_in_progress" }, { status: 409 });
    }

    const { data: record } = await supabase
      .from("cleaning_records")
      .select("id, started_at")
      .eq("job_id", jobId)
      .single();

    if (!record) {
      return NextResponse.json({ error: "record_not_found" }, { status: 404 });
    }

    const completedAt = new Date().toISOString();
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

    await admin.from("jobs").update({ status: "completed" }).eq("id", jobId);

    // 清掃完了通知（LINE 未設定・エラーは無視）
    notifyCleaningCompleted(jobId).catch(() => {});

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
