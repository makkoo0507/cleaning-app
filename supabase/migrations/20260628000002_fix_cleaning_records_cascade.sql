-- cleaning_records.job_id に on delete cascade を追加
alter table public.cleaning_records
  drop constraint cleaning_records_job_id_fkey,
  add constraint cleaning_records_job_id_fkey
    foreign key (job_id) references public.jobs(id) on delete cascade;
