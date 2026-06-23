-- is_platform_admin フラグを role = 'platform_admin' に統合する
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('platform_admin', 'contractor_admin', 'contractor_viewer', 'contractor_vendor', 'cleaner', 'contact'));

-- 既存の platform_admin ユーザーをロール変換
update public.users
set role = 'platform_admin'
where is_platform_admin = true;

-- is_platform_admin カラムを削除
alter table public.users drop column if exists is_platform_admin;
