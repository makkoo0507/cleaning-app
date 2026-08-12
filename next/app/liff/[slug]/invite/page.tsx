import { getLiffIdBySlug } from "@/lib/liff-auth";
import InviteClient from "./InviteClient";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const liffId = await getLiffIdBySlug(slug);

  return <InviteClient liffId={liffId ?? ""} />;
}
