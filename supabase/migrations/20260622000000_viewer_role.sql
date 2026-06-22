-- 社員(contractor_staff)を廃止し、閲覧者(contractor_viewer)を追加。
-- 管理者 = フル権限 / 閲覧者 = 全項目を閲覧のみ（作成・編集・削除は不可）。

-- 既存の社員を閲覧者へ移行
update public.users set role = 'contractor_viewer' where role = 'contractor_staff';

-- role の許可値を更新
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('contractor_admin', 'contractor_viewer', 'cleaner', 'contact'));

-- ── RLS 再定義（書き込み=管理者のみ / 閲覧=管理者+閲覧者）──

-- users: 追加・更新は管理者のみ（参照「同社ユーザーを参照」はそのまま）
drop policy if exists "スタッフがユーザーを追加" on public.users;
drop policy if exists "スタッフがユーザーを更新" on public.users;
create policy "管理者がユーザーを追加"
  on public.users for insert
  with check (
    company_id = public.my_company_id()
    and public.my_role() = 'contractor_admin'
  );
create policy "管理者がユーザーを更新"
  on public.users for update
  using (
    company_id = public.my_company_id()
    and public.my_role() = 'contractor_admin'
  );

-- properties: 管理は管理者のみ（参照「同社メンバーが物件を参照」はそのまま）
drop policy if exists "スタッフが物件を管理" on public.properties;
create policy "管理者が物件を管理"
  on public.properties for all
  using (
    company_id = public.my_company_id()
    and public.my_role() = 'contractor_admin'
  );

-- jobs: 参照=管理者+閲覧者 / 管理=管理者のみ（清掃者の自案件参照はそのまま）
drop policy if exists "スタッフが全案件を参照" on public.jobs;
create policy "管理者と閲覧者が全案件を参照"
  on public.jobs for select
  using (
    company_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_viewer')
  );
drop policy if exists "スタッフが案件を管理" on public.jobs;
create policy "管理者が案件を管理"
  on public.jobs for all
  using (
    company_id = public.my_company_id()
    and public.my_role() = 'contractor_admin'
  );

-- cleaning_records: 参照=管理者+閲覧者（清掃者の自記録管理はそのまま）
drop policy if exists "スタッフが清掃記録を参照" on public.cleaning_records;
create policy "管理者と閲覧者が清掃記録を参照"
  on public.cleaning_records for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = cleaning_records.job_id
        and jobs.company_id = public.my_company_id()
        and public.my_role() in ('contractor_admin', 'contractor_viewer')
    )
  );

-- プロフィール/紐付けの管理は管理者のみ（参照はそのまま）
drop policy if exists "スタッフ_清掃者プロフィール管理" on public.cleaner_profiles;
create policy "管理者_清掃者プロフィール管理"
  on public.cleaner_profiles for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() = 'contractor_admin'
  );

drop policy if exists "スタッフ_関係者プロフィール管理" on public.property_member_profiles;
create policy "管理者_関係者プロフィール管理"
  on public.property_member_profiles for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() = 'contractor_admin'
  );

drop policy if exists "スタッフ_物件紐付け管理" on public.property_members;
create policy "管理者_物件紐付け管理"
  on public.property_members for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() = 'contractor_admin'
  );
