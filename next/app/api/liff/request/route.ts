// 清掃依頼の新規作成（オーナー用）
// POST { propertyId, requestedDate, note? }
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ロール確認（contact のみ）
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role, contractor_id")
    .eq("id", user.id)
    .single<{ role: string; contractor_id: string }>();

  if (!profile || profile.role !== "contact") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { propertyId, requestedDate, note } = body as {
    propertyId: string;
    requestedDate: string;
    note?: string;
  };

  if (!propertyId || !requestedDate) {
    return NextResponse.json({ error: "propertyId and requestedDate required" }, { status: 400 });
  }

  // この物件に関係者として登録されているか確認
  const { data: member } = await admin
    .from("property_members")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 物件のデフォルト時刻を取得
  const { data: property } = await admin
    .from("properties")
    .select("default_start_time, contractor_id")
    .eq("id", propertyId)
    .single<{ default_start_time: string | null; contractor_id: string }>();

  const { error } = await admin
    .from("cleaning_requests")
    .insert({
      contractor_id: property?.contractor_id ?? profile.contractor_id,
      property_id: propertyId,
      requested_by: user.id,
      requested_date: requestedDate,
      requested_start_time: property?.default_start_time ?? null,
      note: note?.trim() || null,
      status: "pending",
    });

  if (error) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
