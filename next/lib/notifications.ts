import { createAdminClient } from "@/lib/supabase/server";
import type { NotificationRecipient, NotificationTrigger } from "@/lib/database.types";

type SettingKey = `${NotificationRecipient}:${NotificationTrigger}`;
type SettingMap = Map<SettingKey, boolean>;

export async function getNotificationSettings(contractorId: string): Promise<SettingMap> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("contractor_notification_settings")
    .select("recipient, trigger, enabled")
    .eq("contractor_id", contractorId);

  const map: SettingMap = new Map();
  for (const row of data ?? []) {
    map.set(`${row.recipient}:${row.trigger}` as SettingKey, row.enabled);
  }
  return map;
}

export async function setNotificationSetting(
  contractorId: string,
  recipient: NotificationRecipient,
  trigger: NotificationTrigger,
  enabled: boolean
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("contractor_notification_settings").upsert({
    contractor_id: contractorId,
    recipient,
    trigger,
    enabled,
    updated_at: new Date().toISOString(),
  });
}
