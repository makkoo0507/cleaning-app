-- LINE のチャネルアクセストークン/シークレットを認証ユーザーから読めないように制限。
-- これらは API 呼び出しに元値が必要でハッシュ化できないため、列レベル権限で
-- authenticated / anon の参照を禁止し、service_role（サーバー処理）のみ読めるようにする。
-- 書き込みは元々 RLS で contractor_companies に UPDATE ポリシーが無く authenticated 不可。

-- いったんテーブル全体の SELECT 権限を外し、機密2列を除いて付与し直す
revoke select on public.contractor_companies from authenticated;
revoke select on public.contractor_companies from anon;

grant select (
  id,
  name,
  plan,
  max_properties,
  max_cleaners,
  created_at,
  slug,
  billing_enabled,
  reminder_cleaner_prev_day,
  reminder_cleaner_same_day,
  reminder_owner_prev_day,
  reminder_owner_same_day
) on public.contractor_companies to authenticated;
