// LIFF セッション（Supabase Cookie）をクリアする
import { NextResponse } from "next/server";
import { createClient, clearStaleAuthCookies } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearStaleAuthCookies();
  return NextResponse.json({ ok: true });
}
