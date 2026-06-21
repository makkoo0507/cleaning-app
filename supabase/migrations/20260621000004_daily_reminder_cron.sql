-- 前日リマインド cron ジョブの登録
--
-- 【事前準備】本番 Supabase Cloud で以下を実行してから db push すること。
--   pg_net 拡張と pg_cron 拡張が有効になっている必要がある。
--
-- 【設定値の確認方法】
--   SUPABASE_URL     : Supabase Dashboard > Project Settings > API > Project URL
--   SERVICE_ROLE_KEY : Supabase Dashboard > Project Settings > API > service_role key
--   FUNCTIONS_URL    : 通常 {SUPABASE_URL}/functions/v1
--
-- 【ローカル開発では不要】
--   supabase db reset 時に実行されるが、ローカルに pg_net がない場合はエラーになる。
--   ローカルでは seed 経由でのテストに留める。

-- アプリ設定（デプロイ先の値に書き換えて db push する）
-- ALTER DATABASE postgres SET app.supabase_functions_url TO 'https://<project-ref>.supabase.co/functions/v1';
-- ALTER DATABASE postgres SET app.service_role_key TO '<service_role_key>';

-- cron ジョブ登録（毎日 20:00 JST = 11:00 UTC）
-- pg_cron が有効な場合のみ実行
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) AND EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) THEN
    PERFORM cron.unschedule('daily-reminder');
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END
$$;

-- 本番での cron 登録は Supabase Dashboard の「Database > Cron Jobs」から
-- または以下の SQL を本番で直接実行する（ローカルでは pg_net が使えないためスキップ）:
--
-- SELECT cron.schedule(
--   'daily-reminder',
--   '0 11 * * *',
--   $$
--     SELECT net.http_post(
--       url       := current_setting('app.supabase_functions_url') || '/daily-reminder',
--       headers   := jsonb_build_object(
--                      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
--                      'Content-Type',  'application/json'
--                    ),
--       body      := '{}'::jsonb
--     );
--   $$
-- );
