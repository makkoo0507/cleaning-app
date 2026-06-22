-- 定期リマインドの会社別設定 と 重複送信防止ログ

-- 会社ごとの送信先・タイミング設定（既定: 清掃者へ前日のみ＝従来動作）
alter table public.contractor_companies
  add column reminder_to_cleaner boolean not null default true,
  add column reminder_to_owner   boolean not null default false,
  add column reminder_prev_day   boolean not null default true,
  add column reminder_same_day   boolean not null default false;

-- 送信済みログ（job_id × kind で一意 → 重複送信を防止）
create table public.reminder_logs (
  id         uuid        primary key default gen_random_uuid(),
  job_id     uuid        not null references public.jobs(id) on delete cascade,
  kind       text        not null check (kind in ('prev_day', 'same_day')),
  sent_at    timestamptz not null default now(),
  unique (job_id, kind)
);

-- リマインド処理は Edge Function（service_role）からのみ行う
alter table public.reminder_logs enable row level security;
grant all on table public.reminder_logs to service_role;
