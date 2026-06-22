-- 請求・支払い機能を会社ごとに ON/OFF できるオプション化。
-- 既定は true（現行どおり利用可能）。管理画面の設定で無効化できる。
alter table public.contractor_companies
  add column billing_enabled boolean not null default true;

comment on column public.contractor_companies.billing_enabled is
  '請求・支払い機能の利用フラグ（false で非表示）';
