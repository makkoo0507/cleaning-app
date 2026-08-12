import { redirect } from "next/navigation";

export default async function CleanerIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/liff/${slug}/cleaner/schedules`);
}
