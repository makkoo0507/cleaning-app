-- プラットフォーム管理者（ベンダー運営）
-- 業者テナントに属さず、ベンダー専用画面から会社＋管理者を発行できる権限。

-- 運営アカウントは特定の会社に属さないため company_id を任意に
alter table public.users alter column company_id drop not null;

-- 運営フラグ（既定 false）
alter table public.users add column is_platform_admin boolean not null default false;
