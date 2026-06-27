-- 物件にデフォルトの請求額・支払い額を追加
alter table properties
  add column if not exists default_billing_amount  integer default null,
  add column if not exists default_payment_amount  integer default null;
