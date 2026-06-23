-- オプション（機能フラグ）をカタログ＋契約モデルに変更。
-- 新オプションは features にカタログ行を足すだけで増やせる（カラム追加不要）。

-- ① オプションのカタログ（運営が定義する「商品」一覧）
create table public.features (
  key         text        primary key,
  name        text        not null,
  description text,
  is_paid     boolean     not null default false,
  sort        int         not null default 0,
  created_at  timestamptz not null default now()
);

-- ② 会社ごとの契約状態（会社 × 機能の ON/OFF）
create table public.company_features (
  company_id  uuid        not null references public.contractor_companies(id) on delete cascade,
  feature_key text        not null references public.features(key) on delete cascade,
  enabled     boolean     not null default false,
  updated_at  timestamptz not null default now(),
  primary key (company_id, feature_key)
);

-- カタログ初期データ
insert into public.features (key, name, description, is_paid, sort) values
  ('billing', '請求・支払い', '案件ごとの請求額・支払い額の記録、月次集計、CSV 出力', true, 10)
on conflict (key) do nothing;

-- 既存の billing_enabled を company_features へ移行
insert into public.company_features (company_id, feature_key, enabled)
select id, 'billing', billing_enabled
from public.contractor_companies
on conflict (company_id, feature_key) do nothing;

-- 旧カラムを廃止
alter table public.contractor_companies drop column billing_enabled;

-- RLS / 権限
alter table public.features enable row level security;
create policy "features を参照" on public.features
  for select to authenticated using (true);
grant select on public.features to authenticated;
grant all on public.features to service_role;

alter table public.company_features enable row level security;
create policy "自社の機能契約を参照" on public.company_features
  for select using (company_id = public.my_company_id());
grant select on public.company_features to authenticated;
grant all on public.company_features to service_role;
