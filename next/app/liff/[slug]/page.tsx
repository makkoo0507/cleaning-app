import { redirect } from "next/navigation";
import { getLiffUser, getLiffIdBySlug } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";

export const dynamic = "force-dynamic";

// LIFF エンドポイント (/liff/[slug])。業者ごとの LIFF ID を slug から解決する。
export default async function LiffIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const liffId = await getLiffIdBySlug(slug);

  // 招待ログインからの戻り: トークンを付けて招待ページへ転送
  if (sp.invite) {
    redirect(`/liff/${slug}/invite?token=${encodeURIComponent(sp.invite)}`);
  }

  // LIFF が目的サブパス(liff.state)へ誘導したい場合は、役割リダイレクトせず
  // クライアントの liff.init に遷移を任せる（例: /owner/schedules を開いたとき）。
  if (sp["liff.state"]) {
    return <LiffBootstrap liffId={liffId ?? ""} />;
  }

  // 通常の直接アクセス: セッションがあれば役割で振り分け
  const user = await getLiffUser();
  if (user?.role === "cleaner") redirect(`/liff/${slug}/cleaner`);
  if (user?.role === "contact") redirect(`/liff/${slug}/owner`);

  return <LiffBootstrap liffId={liffId ?? ""} />;
}
