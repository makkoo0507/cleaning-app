-- RLS ポリシー
-- JWT の app_metadata に company_id と role が入っている前提（auth_hook による）

alter table contractor_companies      enable row level security;
alter table users                     enable row level security;
alter table contractor_member_profiles enable row level security;
alter table cleaner_profiles          enable row level security;
alter table property_member_profiles  enable row level security;
alter table properties                enable row level security;
alter table property_members          enable row level security;
alter table jobs                      enable row level security;
alter table cleaning_records          enable row level security;

-- JWT から company_id / role を取り出すヘルパー関数
create or replace function auth.company_id() returns uuid as $$
  select (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid;
$$ language sql stable;

create or replace function auth.user_role() returns text as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$ language sql stable;

-- contractor_companies: 自社のみ参照可
create policy "自社のみ参照"
  on contractor_companies for select
  using (id = auth.company_id());

-- users: 同じ会社のユーザーを参照可
create policy "同社ユーザーを参照"
  on users for select
  using (company_id = auth.company_id());

create policy "スタッフがユーザーを追加"
  on users for insert
  with check (
    company_id = auth.company_id()
    and auth.user_role() in ('contractor_admin', 'contractor_staff')
  );

create policy "スタッフがユーザーを更新"
  on users for update
  using (
    company_id = auth.company_id()
    and auth.user_role() in ('contractor_admin', 'contractor_staff')
  );

create policy "管理者がユーザーを削除"
  on users for delete
  using (
    company_id = auth.company_id()
    and auth.user_role() = 'contractor_admin'
  );

-- properties: 同社メンバー全員が参照、スタッフのみ編集
create policy "同社メンバーが物件を参照"
  on properties for select
  using (company_id = auth.company_id());

create policy "スタッフが物件を管理"
  on properties for all
  using (
    company_id = auth.company_id()
    and auth.user_role() in ('contractor_admin', 'contractor_staff')
  );

-- jobs: スタッフは全案件、清掃者は自分の案件のみ参照
create policy "スタッフが全案件を参照"
  on jobs for select
  using (
    company_id = auth.company_id()
    and auth.user_role() in ('contractor_admin', 'contractor_staff')
  );

create policy "清掃者が自分の案件を参照"
  on jobs for select
  using (
    company_id = auth.company_id()
    and auth.user_role() = 'cleaner'
    and cleaner_id = auth.uid()
  );

create policy "スタッフが案件を管理"
  on jobs for all
  using (
    company_id = auth.company_id()
    and auth.user_role() in ('contractor_admin', 'contractor_staff')
  );

-- cleaning_records: 清掃者は自分の案件の記録のみ管理、スタッフは全参照
create policy "スタッフが清掃記録を参照"
  on cleaning_records for select
  using (
    exists (
      select 1 from jobs
      where jobs.id = cleaning_records.job_id
        and jobs.company_id = auth.company_id()
        and auth.user_role() in ('contractor_admin', 'contractor_staff')
    )
  );

create policy "清掃者が自分の記録を管理"
  on cleaning_records for all
  using (
    exists (
      select 1 from jobs
      where jobs.id = cleaning_records.job_id
        and jobs.cleaner_id = auth.uid()
    )
  );
