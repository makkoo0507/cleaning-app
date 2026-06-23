-- 民泊清掃管理 SaaS — 初期スキーマ（統合版）
-- 全マイグレーションを統合したクリーンな単一ファイル

-- ── ヘルパー関数 ──────────────────────────────────────────────────────────────

-- JWT の app_metadata から contractor_id を取り出す
create or replace function public.my_company_id() returns uuid as $$
  select (auth.jwt() -> 'app_metadata' ->> 'contractor_id')::uuid;
$$ language sql stable security definer;

-- JWT の app_metadata から role を取り出す
create or replace function public.my_role() returns text as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$ language sql stable security definer;

-- カスタム JWT フック: ログイン時に contractor_id と role を app_metadata に追加する
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims             jsonb;
  user_contractor_id uuid;
  user_role          text;
begin
  select contractor_id, role
    into user_contractor_id, user_role
    from public.users
   where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_contractor_id is not null then
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      coalesce(claims -> 'app_metadata', '{}'::jsonb)
      || jsonb_build_object(
           'contractor_id', user_contractor_id,
           'role',          user_role
         )
    );
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage  on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ── テーブル ──────────────────────────────────────────────────────────────────

-- 業者（清掃請負会社）
create table public.contractors (
  id                       uuid        primary key default gen_random_uuid(),
  name                     text        not null,
  plan                     text        not null default 'free',
  max_properties           int,
  max_cleaners             int,
  line_channel_access_token text,
  line_channel_secret      text,
  slug                     text        unique,
  created_at               timestamptz not null default now(),
  constraint contractors_plan_check check (plan in ('free', 'paid'))
);

comment on column public.contractors.slug is '業者別ログインURLのスラッグ（例: /{slug}/login）。半角英数字とハイフン推奨。';

-- ユーザー（全ロール共通）
create table public.users (
  id           uuid        primary key references auth.users(id) on delete cascade,
  contractor_id uuid       references public.contractors(id),
  role         text        not null,
  name         text        not null,
  line_user_id text,
  invite_token uuid        unique,
  created_at   timestamptz not null default now(),
  constraint users_role_check check (role in (
    'platform_admin', 'contractor_admin', 'contractor_viewer',
    'contractor_vendor', 'cleaner', 'contact'
  ))
);

-- 業者スタッフのプロフィール
create table public.contractor_member_profiles (
  user_id       uuid primary key references public.users(id) on delete cascade,
  department    text,
  employee_code text,
  note          text,
  created_at    timestamptz not null default now()
);

-- 清掃者のプロフィール
create table public.cleaner_profiles (
  user_id    uuid primary key references public.users(id) on delete cascade,
  skills     text,
  note       text,
  created_at timestamptz not null default now()
);

-- 物件
create table public.properties (
  id            uuid        primary key default gen_random_uuid(),
  contractor_id uuid        not null references public.contractors(id),
  name          text        not null,
  address       text        not null,
  notes         text,
  created_at    timestamptz not null default now()
);

-- 物件関係者（オーナー等）の紐付け
create table public.property_members (
  user_id     uuid    not null references public.users(id) on delete cascade,
  property_id uuid    not null references public.properties(id) on delete cascade,
  role        text    not null,
  notify      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- 物件関係者のプロフィール
create table public.property_member_profiles (
  user_id         uuid primary key references public.users(id) on delete cascade,
  company_name    text,
  phone           text,
  billing_address text,
  created_at      timestamptz not null default now()
);

-- 清掃案件
create table public.jobs (
  id                   uuid        primary key default gen_random_uuid(),
  contractor_id        uuid        not null references public.contractors(id),
  property_id          uuid        not null references public.properties(id),
  cleaner_id           uuid        references public.users(id),
  scheduled_date       date        not null,
  scheduled_start_time time,
  status               text        not null default 'scheduled',
  billing_amount       numeric,
  payment_amount       numeric,
  created_at           timestamptz not null default now(),
  constraint jobs_status_check check (status in ('scheduled', 'in_progress', 'completed'))
);

-- 清掃記録
create table public.cleaning_records (
  id               uuid        primary key default gen_random_uuid(),
  job_id           uuid        not null references public.jobs(id),
  started_at       timestamptz not null,
  completed_at     timestamptz,
  duration_minutes int,
  memo             text,
  created_at       timestamptz not null default now()
);

-- オプション機能カタログ
create table public.features (
  key         text    primary key,
  name        text    not null,
  description text,
  is_paid     boolean not null default false,
  sort        int     not null default 0,
  created_at  timestamptz not null default now()
);

-- 業者ごとのオプション加入状況
create table public.contractor_features (
  contractor_id uuid    not null references public.contractors(id) on delete cascade,
  feature_key   text    not null references public.features(key)   on delete cascade,
  enabled       boolean not null default false,
  updated_at    timestamptz not null default now(),
  primary key (contractor_id, feature_key)
);

-- 業者ごとの通知設定
create table public.contractor_notification_settings (
  contractor_id uuid    not null references public.contractors(id) on delete cascade,
  recipient     text    not null, -- 'cleaner' | 'owner'
  trigger       text    not null, -- 'reminder_prev_day' | 'reminder_same_day' | 'job_completed' など
  enabled       boolean not null default false,
  updated_at    timestamptz not null default now(),
  primary key (contractor_id, recipient, trigger)
);

-- リマインド送信ログ（重複送信防止）
create table public.reminder_logs (
  id      uuid        primary key default gen_random_uuid(),
  job_id  uuid        not null references public.jobs(id) on delete cascade,
  kind    text        not null,
  sent_at timestamptz not null default now(),
  unique (job_id, kind),
  constraint reminder_logs_kind_check check (kind in ('prev_day', 'same_day'))
);

-- ── ヘルパー関数（テーブル参照あり・テーブル作成後に定義）────────────────────

-- 同じ業者に属するユーザーか判定する
create or replace function public.is_same_contractor_user(target uuid) returns boolean
  language sql stable security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.users u
     where u.id = target
       and u.contractor_id = public.my_company_id()
  );
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.contractors                     enable row level security;
alter table public.users                           enable row level security;
alter table public.contractor_member_profiles      enable row level security;
alter table public.cleaner_profiles                enable row level security;
alter table public.properties                      enable row level security;
alter table public.property_members                enable row level security;
alter table public.property_member_profiles        enable row level security;
alter table public.jobs                            enable row level security;
alter table public.cleaning_records                enable row level security;
alter table public.features                        enable row level security;
alter table public.contractor_features             enable row level security;
alter table public.contractor_notification_settings enable row level security;
alter table public.reminder_logs                   enable row level security;

-- contractors
create policy "自社のみ参照"
  on public.contractors for select
  using (id = public.my_company_id());

-- users
create policy "同社ユーザーを参照"
  on public.users for select
  using (contractor_id = public.my_company_id());

create policy "管理者がユーザーを追加"
  on public.users for insert
  with check (contractor_id = public.my_company_id() and public.my_role() in ('contractor_admin', 'contractor_vendor'));

create policy "管理者がユーザーを更新"
  on public.users for update
  using (contractor_id = public.my_company_id() and public.my_role() in ('contractor_admin', 'contractor_vendor'));

create policy "管理者がユーザーを削除"
  on public.users for delete
  using (contractor_id = public.my_company_id() and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- profiles
create policy "同社_社員プロフィール参照"
  on public.contractor_member_profiles for select
  using (public.is_same_contractor_user(user_id));

create policy "管理者_社員プロフィール管理"
  on public.contractor_member_profiles
  using (public.is_same_contractor_user(user_id) and public.my_role() in ('contractor_admin', 'contractor_vendor'));

create policy "同社_清掃者プロフィール参照"
  on public.cleaner_profiles for select
  using (public.is_same_contractor_user(user_id));

create policy "管理者_清掃者プロフィール管理"
  on public.cleaner_profiles
  using (public.is_same_contractor_user(user_id) and public.my_role() in ('contractor_admin', 'contractor_vendor'));

create policy "同社_関係者プロフィール参照"
  on public.property_member_profiles for select
  using (public.is_same_contractor_user(user_id));

create policy "管理者_関係者プロフィール管理"
  on public.property_member_profiles
  using (public.is_same_contractor_user(user_id) and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- properties
create policy "同社メンバーが物件を参照"
  on public.properties for select
  using (contractor_id = public.my_company_id());

create policy "管理者が物件を管理"
  on public.properties
  using (contractor_id = public.my_company_id() and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- property_members
create policy "同社_物件紐付け参照"
  on public.property_members for select
  using (public.is_same_contractor_user(user_id));

create policy "管理者_物件紐付け管理"
  on public.property_members
  using (public.is_same_contractor_user(user_id) and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- jobs
create policy "管理者と閲覧者が全案件を参照"
  on public.jobs for select
  using (contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_viewer'));

create policy "清掃者が自分の案件を参照"
  on public.jobs for select
  using (contractor_id = public.my_company_id()
    and public.my_role() = 'cleaner'
    and cleaner_id = auth.uid());

create policy "管理者が案件を管理"
  on public.jobs
  using (contractor_id = public.my_company_id() and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- cleaning_records
create policy "管理者と閲覧者が清掃記録を参照"
  on public.cleaning_records for select
  using (exists (
    select 1 from public.jobs
     where jobs.id = cleaning_records.job_id
       and jobs.contractor_id = public.my_company_id()
       and public.my_role() in ('contractor_admin', 'contractor_viewer')
  ));

create policy "清掃者が自分の記録を管理"
  on public.cleaning_records
  using (exists (
    select 1 from public.jobs
     where jobs.id = cleaning_records.job_id
       and jobs.cleaner_id = auth.uid()
  ));

-- features
create policy "features を参照"
  on public.features for select to authenticated
  using (true);

-- contractor_features
create policy "自社の機能契約を参照"
  on public.contractor_features for select
  using (contractor_id = public.my_company_id());

-- contractor_notification_settings
create policy "自社の通知設定を参照"
  on public.contractor_notification_settings for select
  using (contractor_id = public.my_company_id());

-- ── グラント ─────────────────────────────────────────────────────────────────

-- contractors: 機密カラム（LINE トークン）は authenticated から除外
revoke select on public.contractors from authenticated;
revoke select on public.contractors from anon;
grant select (
  id, name, plan, max_properties, max_cleaners, slug, created_at
) on public.contractors to authenticated;

-- その他テーブル
grant select, insert, update, delete on public.users                            to authenticated;
grant select, insert, update, delete on public.contractor_member_profiles       to authenticated;
grant select, insert, update, delete on public.cleaner_profiles                 to authenticated;
grant select, insert, update, delete on public.properties                       to authenticated;
grant select, insert, update, delete on public.property_members                 to authenticated;
grant select, insert, update, delete on public.property_member_profiles         to authenticated;
grant select, insert, update, delete on public.jobs                             to authenticated;
grant select, insert, update, delete on public.cleaning_records                 to authenticated;
grant select                         on public.features                         to authenticated;
grant select                         on public.contractor_features              to authenticated;
grant select                         on public.contractor_notification_settings to authenticated;

grant all on public.contractors                      to service_role;
grant all on public.users                            to service_role;
grant all on public.contractor_member_profiles       to service_role;
grant all on public.cleaner_profiles                 to service_role;
grant all on public.properties                       to service_role;
grant all on public.property_members                 to service_role;
grant all on public.property_member_profiles         to service_role;
grant all on public.jobs                             to service_role;
grant all on public.cleaning_records                 to service_role;
grant all on public.features                         to service_role;
grant all on public.contractor_features              to service_role;
grant all on public.contractor_notification_settings to service_role;
grant all on public.reminder_logs                    to service_role;

-- ── マスタデータ ──────────────────────────────────────────────────────────────

-- オプション機能カタログ初期データ
insert into public.features (key, name, description, is_paid, sort)
values ('billing', '請求・支払い管理', '案件ごとの請求額・支払額の記録とCSV出力', true, 10);
