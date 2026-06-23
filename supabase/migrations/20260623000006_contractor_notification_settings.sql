-- contractor_notification_settings テーブルを作成し、
-- contractors の reminder_* カラムからデータを移行して削除する

create table public.contractor_notification_settings (
  contractor_id  uuid    not null references public.contractors(id) on delete cascade,
  recipient      text    not null, -- 'cleaner' | 'owner'
  trigger        text    not null, -- 'reminder_prev_day' | 'reminder_same_day' | 'job_completed' など
  enabled        boolean not null default false,
  updated_at     timestamptz not null default now(),
  primary key (contractor_id, recipient, trigger)
);

-- 既存データを移行
insert into public.contractor_notification_settings (contractor_id, recipient, trigger, enabled)
select id, 'cleaner', 'reminder_prev_day', reminder_cleaner_prev_day from public.contractors;

insert into public.contractor_notification_settings (contractor_id, recipient, trigger, enabled)
select id, 'cleaner', 'reminder_same_day', reminder_cleaner_same_day from public.contractors;

insert into public.contractor_notification_settings (contractor_id, recipient, trigger, enabled)
select id, 'owner', 'reminder_prev_day', reminder_owner_prev_day from public.contractors;

insert into public.contractor_notification_settings (contractor_id, recipient, trigger, enabled)
select id, 'owner', 'reminder_same_day', reminder_owner_same_day from public.contractors;

-- 旧カラムを削除
alter table public.contractors
  drop column reminder_cleaner_prev_day,
  drop column reminder_cleaner_same_day,
  drop column reminder_owner_prev_day,
  drop column reminder_owner_same_day;

-- RLS
alter table public.contractor_notification_settings enable row level security;

create policy "自社の通知設定を参照"
  on public.contractor_notification_settings for select
  using (contractor_id = public.my_company_id());

grant select on public.contractor_notification_settings to authenticated;
grant all   on public.contractor_notification_settings to service_role;
