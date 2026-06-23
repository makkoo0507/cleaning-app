-- 会社ごとの「ベンダー用管理者」アカウント。
-- 業者テナント内の contractor_admin だが、運営(ベンダー)が保有・管理する隠しアカウント。
-- 業者の「ユーザー管理」には表示せず、運営は /{slug}/login から通常どおりログインできる。
alter table public.users
  add column vendor_managed boolean not null default false;

comment on column public.users.vendor_managed is
  'true の場合、運営保有の隠し管理者。業者のユーザー管理には出さない。';
