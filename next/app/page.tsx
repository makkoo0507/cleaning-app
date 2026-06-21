import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import SlugEntry from "./SlugEntry";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  // 直近に使った会社のログインURLが分かれば誘導
  const slug = (await cookies()).get("company_slug")?.value;
  if (slug) redirect(`/${slug}/login`);

  // 会社が不明な場合は slug 入力画面
  return <SlugEntry />;
}
