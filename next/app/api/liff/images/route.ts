// 清掃写真のアップロード・削除API（清掃者用）
// POST: multipart/form-data { file, jobId } → Storage + cleaning_images に保存
// DELETE: { imageId } → share_with_owner = false の写真のみ削除可
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStoragePath } from "@/lib/compress-image";

const BUCKET = "cleaning-images";
const MAX_IMAGES = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const jobId = formData.get("jobId") as string | null;

  if (!file || !jobId) {
    return NextResponse.json({ error: "file and jobId required" }, { status: 400 });
  }

  // 担当確認（本人がアサインされた案件のみ）
  const { data: job } = await supabase
    .from("jobs")
    .select("id, cleaner_id, contractor_id")
    .eq("id", jobId)
    .single();

  if (!job || job.cleaner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // 30枚上限チェック
  const { count } = await admin
    .from("cleaning_images")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);

  if ((count ?? 0) >= MAX_IMAGES) {
    return NextResponse.json({ error: "limit_exceeded" }, { status: 422 });
  }

  const storagePath = getStoragePath(job.contractor_id, jobId, file.name);

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { error: insertError } = await admin.from("cleaning_images").insert({
    job_id: jobId,
    storage_path: storagePath,
    share_with_owner: false,
    uploaded_by: user.id,
  });

  if (insertError) {
    await admin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { imageId } = (await req.json()) as { imageId: string };
  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: image } = await admin
    .from("cleaning_images")
    .select("id, storage_path, share_with_owner, job_id")
    .eq("id", imageId)
    .single();

  if (!image) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (image.share_with_owner) {
    return NextResponse.json({ error: "cannot_delete_shared" }, { status: 403 });
  }

  // 担当確認（清掃者自身のアサイン案件のみ）
  const { data: job } = await supabase
    .from("jobs")
    .select("id, cleaner_id")
    .eq("id", image.job_id)
    .single();

  if (!job || job.cleaner_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error: storageError } = await admin.storage
    .from(BUCKET)
    .remove([image.storage_path]);

  if (storageError) {
    return NextResponse.json({ error: "storage_delete_failed" }, { status: 500 });
  }

  await admin.from("cleaning_images").delete().eq("id", imageId);

  return NextResponse.json({ ok: true });
}
