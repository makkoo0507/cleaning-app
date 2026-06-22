// middleware からセッション Cookie を更新し、未認証ユーザーを保護する
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/schedules",
  "/properties",
  "/cleaners",
  "/owners",
  "/staff",
  "/records",
  "/billing",
  "/settings",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // 会社別ログイン: /{slug}/login
  const loginMatch = path.match(/^\/([^/]+)\/login\/?$/);
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  // ログインページを訪れたら、その会社 slug を cookie に記録しておく
  // （未認証で保護ページに来たときの戻り先に使う）
  if (loginMatch) {
    const slug = loginMatch[1];
    if (user) {
      // ログイン済みならダッシュボードへ
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    supabaseResponse.cookies.set("company_slug", slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
    });
    return supabaseResponse;
  }

  if (!user && isProtected) {
    const slug = request.cookies.get("company_slug")?.value;
    const url = request.nextUrl.clone();
    url.pathname = slug ? `/${slug}/login` : "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
