import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// 管理画面の手動同期ボタンから呼び出される。
// Edge Function sync-ical を property_id 指定で実行する。
export async function POST(request: NextRequest) {
  await requireAdmin();

  const { property_id } = await request.json();
  if (!property_id) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/functions/v1/sync-ical`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ property_id }),
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json({ error: text }, { status: 500 });
  }
  return NextResponse.json({ message: text });
}
