-- 会社ごとのログインURL（パス方式）用に slug を追加
-- 例: /acme/login → contractor_companies.slug = 'acme'
-- slug によるルックアップは未認証ページから行うため、アプリ側は service role
-- （createAdminClient）で参照する。RLS は変更しない。

alter table contractor_companies
  add column slug text unique;

comment on column contractor_companies.slug is
  '会社別ログインURLのスラッグ（例: /{slug}/login）。半角英数字とハイフン推奨。';
