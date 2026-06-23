import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ベンダーセッションをサインアウトして、指定会社のログインページへ遷移する。
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.redirect(new URL("/vendor", request.url), 303);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(`/${slug}/login`, request.url), 303);
}
