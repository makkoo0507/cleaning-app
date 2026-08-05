"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { IcalFeedType } from "@/lib/database.types";

export interface IcalFormState {
  error?: string;
  success?: boolean;
}

export async function addIcalFeed(
  propertyId: string,
  _prev: IcalFormState,
  formData: FormData
): Promise<IcalFormState> {
  const user = await requireAdmin();
  const feed_type = String(formData.get("feed_type") ?? "") as IcalFeedType;
  const name = String(formData.get("name") ?? "").trim();
  const url  = String(formData.get("url")  ?? "").trim();

  if (!name || !url) return { error: "名前と URL は必須です。" };
  if (!url.startsWith("http")) return { error: "有効な URL を入力してください。" };
  if (!["site_controller", "ota"].includes(feed_type)) return { error: "利用形態を選択してください。" };

  const supabase = await createClient();
  const { error } = await supabase.from("ical_feeds").insert({
    contractor_id: user.contractorId,
    property_id: propertyId,
    feed_type,
    name,
    url,
  });

  if (error) return { error: "登録に失敗しました。" };

  revalidatePath(`/properties/${propertyId}/edit`);
  return { success: true };
}

export async function deleteIcalFeed(formData: FormData) {
  await requireAdmin();
  const id         = String(formData.get("id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("ical_feeds").delete().eq("id", id);
  revalidatePath(`/properties/${propertyId}/edit`);
}
