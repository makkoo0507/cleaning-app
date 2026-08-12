import { getLiffIdBySlug } from "@/lib/liff-auth";
import LogoutClient from "./LogoutClient";

export const dynamic = "force-dynamic";

export default async function LiffLogoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const liffId = await getLiffIdBySlug(slug);

  return <LogoutClient liffId={liffId ?? ""} />;
}
