import { redirect } from "next/navigation";
import { getLiffUser, LIFF_IDS } from "@/lib/liff-auth";
import LiffBootstrap from "@/app/liff/_components/LiffBootstrap";

export const dynamic = "force-dynamic";

// LIFF 共通エンドポイント (/liff)。ログイン後、役割に応じた画面へ振り分ける。
export default async function LiffIndexPage() {
  const user = await getLiffUser();
  if (user?.role === "cleaner") redirect("/liff/cleaner");
  if (user?.role === "contact") redirect("/liff/owner");

  // 未認証: LINE ログイン → セッション発行後に再評価され、上のリダイレクトが効く
  // （ログインはチャネル単位のため、初期化に使う LIFF ID はどちらでもよい）
  return <LiffBootstrap liffId={LIFF_IDS.cleaner} />;
}
