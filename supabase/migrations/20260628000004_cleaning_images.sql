-- Storage バケット作成（プライベート・5MB上限・画像のみ）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cleaning-images',
  'cleaning-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- storage.objects のRLS（アップロードはAPIルート経由でservice_roleを使うため不要）
-- 署名付きURLで配信するためclientからの直接アクセスも不要

-- 清掃写真テーブル
create table public.cleaning_images (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.jobs(id) on delete cascade,
  storage_path     text not null,
  share_with_owner boolean not null default false,
  uploaded_by      uuid not null references public.users(id) on delete cascade,
  created_at       timestamptz not null default now()
);

alter table public.cleaning_images enable row level security;

-- 業者スタッフ・ベンダー: 自社案件の全写真を閲覧・削除
create policy "業者スタッフが清掃写真を管理"
  on public.cleaning_images
  for all
  using (
    exists (
      select 1 from public.jobs
       where jobs.id = cleaning_images.job_id
         and jobs.contractor_id = public.my_company_id()
         and public.my_role() in ('contractor_admin', 'contractor_vendor')
    )
  );

-- 清掃者: アサインされた案件の写真をアップロード・閲覧
--         削除は share_with_owner = false のみ（アプリ側でチェック）
create policy "清掃者がアサイン案件の写真を閲覧"
  on public.cleaning_images
  for select
  using (
    exists (
      select 1 from public.jobs
       where jobs.id = cleaning_images.job_id
         and jobs.cleaner_id = auth.uid()
    )
  );

create policy "清掃者がアサイン案件に写真をアップロード"
  on public.cleaning_images
  for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.jobs
       where jobs.id = cleaning_images.job_id
         and jobs.cleaner_id = auth.uid()
    )
  );

create policy "清掃者が未共有写真を削除"
  on public.cleaning_images
  for delete
  using (
    uploaded_by = auth.uid()
    and share_with_owner = false
    and exists (
      select 1 from public.jobs
       where jobs.id = cleaning_images.job_id
         and jobs.cleaner_id = auth.uid()
    )
  );

-- オーナー: share_with_owner = true の自物件写真のみ閲覧
create policy "オーナーが共有写真を閲覧"
  on public.cleaning_images
  for select
  using (
    share_with_owner = true
    and exists (
      select 1 from public.jobs
        join public.property_members
          on property_members.property_id = jobs.property_id
         and property_members.user_id = auth.uid()
       where jobs.id = cleaning_images.job_id
    )
  );

grant select, insert, update, delete on public.cleaning_images to authenticated;
grant all on public.cleaning_images to service_role;

-- jobs に reported_at を追加
alter table public.jobs
  add column if not exists reported_at timestamptz default null;
