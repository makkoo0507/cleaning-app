-- contractor_vendor も清掃記録を参照できるようにポリシーを更新
drop policy "管理者と閲覧者が清掃記録を参照" on public.cleaning_records;

create policy "管理者と閲覧者が清掃記録を参照"
  on public.cleaning_records for select
  using (exists (
    select 1 from public.jobs
     where jobs.id = cleaning_records.job_id
       and jobs.contractor_id = public.my_company_id()
       and public.my_role() in ('contractor_admin', 'contractor_viewer', 'contractor_vendor')
  ));
