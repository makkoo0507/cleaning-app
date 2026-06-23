-- company_id カラムを contractor_id にリネーム（全テーブル）
alter table public.users              rename column company_id to contractor_id;
alter table public.properties         rename column company_id to contractor_id;
alter table public.jobs               rename column company_id to contractor_id;
alter table public.contractor_features rename column company_id to contractor_id;
