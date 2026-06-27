-- cleaning_requests の RLS ポリシーを my_company_id() / my_role() に統一
drop policy if exists "contractor staff can manage requests" on cleaning_requests;
drop policy if exists "contact can view own requests" on cleaning_requests;
drop policy if exists "contact can insert own requests" on cleaning_requests;

-- 業者スタッフ（管理者・閲覧者・ベンダー）：自社テナントの依頼を全操作
create policy "contractor can manage requests"
  on cleaning_requests
  for all
  using (
    contractor_id = public.my_company_id()
    and public.my_role() in ('contractor_admin', 'contractor_viewer', 'contractor_vendor')
  );

-- オーナー（contact）：自分の依頼を参照・作成
create policy "contact can view own requests"
  on cleaning_requests
  for select
  using (requested_by = auth.uid());

create policy "contact can insert own requests"
  on cleaning_requests
  for insert
  with check (requested_by = auth.uid());
