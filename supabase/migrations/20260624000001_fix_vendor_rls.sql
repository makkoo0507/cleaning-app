-- contractor_vendor ロールを管理者相当として RLS ポリシーに追加

-- users
drop policy if exists "管理者がユーザーを追加" on public.users;
drop policy if exists "管理者がユーザーを更新" on public.users;
drop policy if exists "管理者がユーザーを削除" on public.users;

create policy "管理者がユーザーを追加"
  on public.users for insert
  with check (contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

create policy "管理者がユーザーを更新"
  on public.users for update
  using (contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

create policy "管理者がユーザーを削除"
  on public.users for delete
  using (contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- contractor_member_profiles
drop policy if exists "管理者_社員プロフィール管理" on public.contractor_member_profiles;
create policy "管理者_社員プロフィール管理"
  on public.contractor_member_profiles
  using (public.is_same_contractor_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- cleaner_profiles
drop policy if exists "管理者_清掃者プロフィール管理" on public.cleaner_profiles;
create policy "管理者_清掃者プロフィール管理"
  on public.cleaner_profiles
  using (public.is_same_contractor_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- property_member_profiles
drop policy if exists "管理者_関係者プロフィール管理" on public.property_member_profiles;
create policy "管理者_関係者プロフィール管理"
  on public.property_member_profiles
  using (public.is_same_contractor_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- properties
drop policy if exists "管理者が物件を管理" on public.properties;
create policy "管理者が物件を管理"
  on public.properties
  using (contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- property_members
drop policy if exists "管理者_物件紐付け管理" on public.property_members;
create policy "管理者_物件紐付け管理"
  on public.property_members
  using (public.is_same_contractor_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));

-- jobs
drop policy if exists "管理者が案件を管理" on public.jobs;
create policy "管理者が案件を管理"
  on public.jobs
  using (contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_vendor'));
