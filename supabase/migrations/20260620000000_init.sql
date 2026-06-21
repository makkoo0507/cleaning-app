-- テーブル定義

-- 清掃業者テナント
create table contractor_companies (
  id                         uuid        primary key default gen_random_uuid(),
  name                       text        not null,
  plan                       text        not null default 'free',
  max_properties             int,
  max_cleaners               int,
  line_channel_access_token  text,
  line_channel_secret        text,
  created_at                 timestamptz not null default now()
);

-- 全ユーザー共通（認証・通知・ロール）
create table users (
  id            uuid        primary key references auth.users(id) on delete cascade,
  company_id    uuid        not null references contractor_companies(id),
  role          text        not null check (role in ('contractor_admin', 'contractor_staff', 'cleaner', 'contact')),
  name          text        not null,
  line_user_id  text,
  invite_token  uuid        unique,
  created_at    timestamptz not null default now()
);

-- 業者テナント関係者プロフィール（role = contractor_admin / contractor_staff）
create table contractor_member_profiles (
  user_id         uuid primary key references users(id) on delete cascade,
  department      text,
  employee_code   text,
  note            text,
  created_at      timestamptz not null default now()
);

-- 清掃者プロフィール（role = cleaner）
create table cleaner_profiles (
  user_id    uuid primary key references users(id) on delete cascade,
  skills     text,
  note       text,
  created_at timestamptz not null default now()
);

-- 物件関係者プロフィール（role = contact）
create table property_member_profiles (
  user_id         uuid primary key references users(id) on delete cascade,
  company_name    text,
  phone           text,
  billing_address text,
  created_at      timestamptz not null default now()
);

-- 民泊物件
create table properties (
  id         uuid        primary key default gen_random_uuid(),
  company_id uuid        not null references contractor_companies(id),
  name       text        not null,
  address    text        not null,
  notes      text,
  created_at timestamptz not null default now()
);

-- 物件ごとの関係者紐付け（1人が複数物件を担当可）
create table property_members (
  user_id     uuid    not null references users(id) on delete cascade,
  property_id uuid    not null references properties(id) on delete cascade,
  role        text    not null,
  notify      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- 清掃案件
create table jobs (
  id                   uuid        primary key default gen_random_uuid(),
  company_id           uuid        not null references contractor_companies(id),
  property_id          uuid        not null references properties(id),
  cleaner_id           uuid        references users(id),
  scheduled_date       date        not null,
  scheduled_start_time time,
  status               text        not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  billing_amount       numeric,
  payment_amount       numeric,
  created_at           timestamptz not null default now()
);

-- 清掃記録
create table cleaning_records (
  id               uuid        primary key default gen_random_uuid(),
  job_id           uuid        not null references jobs(id),
  started_at       timestamptz not null,
  completed_at     timestamptz,
  duration_minutes int,
  memo             text,
  created_at       timestamptz not null default now()
);
