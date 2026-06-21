-- service_role へのテーブル権限付与
-- service_role は RLS をバイパスするが、テーブルレベルの GRANT は別途必要。
-- マイグレーションで作成したテーブルには付与されておらず、
-- createAdminClient を使う処理（清掃者/関係者/社員の作成、slug ルックアップ等）が
-- "permission denied for table" で失敗していたため付与する。

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant usage on schema public to service_role;
