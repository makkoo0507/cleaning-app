-- 清掃依頼テーブル
create table if not exists cleaning_requests (
  id                    uuid primary key default gen_random_uuid(),
  contractor_id         uuid not null references contractors(id) on delete cascade,
  property_id           uuid not null references properties(id) on delete cascade,
  requested_by          uuid not null references users(id) on delete cascade,
  requested_date        date not null,
  requested_start_time  time default null,
  note                  text default null,
  status                text not null default 'pending',
  rejection_reason      text default null,
  created_at            timestamptz not null default now(),
  constraint cleaning_requests_status_check check (status in ('pending', 'approved', 'rejected'))
);

-- RLS
alter table cleaning_requests enable row level security;

-- 業者スタッフ：自社テナントの依頼を全操作
create policy "contractor staff can manage requests"
  on cleaning_requests
  for all
  using (
    contractor_id = (
      select contractor_id from users where id = auth.uid()
    )
  );

-- オーナー（contact）：自分の依頼のみ参照・作成
create policy "contact can view own requests"
  on cleaning_requests
  for select
  using (requested_by = auth.uid());

create policy "contact can insert own requests"
  on cleaning_requests
  for insert
  with check (requested_by = auth.uid());

-- jobs テーブルに request_id を追加
alter table jobs
  add column if not exists request_id uuid default null references cleaning_requests(id) on delete set null;
