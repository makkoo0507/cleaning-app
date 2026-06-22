import { redirect } from "next/navigation";
import { getLiffUser, LIFF_ID } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";

export const dynamic = "force-dynamic";

// LIFF 共通エンドポイント (/liff)。
export default async function LiffIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  // 招待ログインからの戻り: トークンを付けて招待ページへ転送
  if (sp.invite) {
    redirect(`/liff/invite?token=${encodeURIComponent(sp.invite)}`);
  }

  // LIFF が目的サブパス(liff.state)へ誘導したい場合は、役割リダイレクトせず
  // クライアントの liff.init に遷移を任せる（例: /owner/schedules を開いたとき）。
  if (sp["liff.state"]) {
    return <LiffBootstrap liffId={LIFF_ID} />;
  }

  // 通常の直接アクセス: セッションがあれば役割で振り分け
  const user = await getLiffUser();
  if (user?.role === "cleaner") redirect("/liff/cleaner");
  if (user?.role === "contact") redirect("/liff/owner");

  return <LiffBootstrap liffId={LIFF_ID} />;
}
