-- contractor_vendor ロールを追加し、vendor_managed フラグを廃止する
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('contractor_admin', 'contractor_viewer', 'cleaner', 'contact', 'contractor_vendor'));

-- 既存の vendor_managed=true アカウントをロール変換
update public.users
set role = 'contractor_vendor'
where vendor_managed = true;

-- vendor_managed カラムを削除
alter table public.users drop column if exists vendor_managed;
