"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/database.types";

// ログアウト: 所属会社の slug を引いてから会社別ログインURLへ戻す
export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let slug: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle<Pick<User, "company_id">>();
    if (data) {
      const { data: company } = await supabase
        .from("contractor_companies")
        .select("slug")
        .eq("id", data.company_id)
        .maybeSingle<{ slug: string | null }>();
      slug = company?.slug ?? null;
    }
  }

  await supabase.auth.signOut();
  redirect(slug ? `/${slug}/login` : "/");
}
