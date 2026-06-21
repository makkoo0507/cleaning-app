-- RLS 補完: テーブル権限の付与 と プロフィール/紐付けテーブルのポリシー追加
--
-- 問題1: RLS は有効だが authenticated ロールにテーブル権限(GRANT)が無く
--        "permission denied for table" になっていた。
-- 問題2: contractor_member_profiles / cleaner_profiles /
--        property_member_profiles / property_members は RLS 有効だが
--        ポリシー未定義のため全アクセスが拒否されていた。

-- ── テーブル権限の付与 ───────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- 実際の行レベルのアクセス可否は各テーブルの RLS ポリシーで制御される。

-- ── プロフィール/紐付けテーブルのポリシー ──────────
-- 同一会社のユーザーに属するプロフィールか判定するヘルパー
create or replace function public.is_same_company_user(target uuid)
returns boolean as $$
  select exists (
    select 1 from public.users u
     where u.id = target
       and u.company_id = public.my_company_id()
  );
$$ language sql stable security definer set search_path = public;

-- contractor_member_profiles（社員/管理者プロフィール）
create policy "同社_社員プロフィール参照"
  on contractor_member_profiles for select
  using (public.is_same_company_user(user_id));

create policy "管理者_社員プロフィール管理"
  on contractor_member_profiles for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() = 'contractor_admin'
  );

-- cleaner_profiles（清掃者プロフィール）
create policy "同社_清掃者プロフィール参照"
  on cleaner_profiles for select
  using (public.is_same_company_user(user_id));

create policy "スタッフ_清掃者プロフィール管理"
  on cleaner_profiles for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_staff')
  );

-- property_member_profiles（物件関係者プロフィール）
create policy "同社_関係者プロフィール参照"
  on property_member_profiles for select
  using (public.is_same_company_user(user_id));

create policy "スタッフ_関係者プロフィール管理"
  on property_member_profiles for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_staff')
  );

-- property_members（物件と関係者の紐付け）
create policy "同社_物件紐付け参照"
  on property_members for select
  using (public.is_same_company_user(user_id));

create policy "スタッフ_物件紐付け管理"
  on property_members for all
  using (
    public.is_same_company_user(user_id)
    and public.my_role() in ('contractor_admin', 'contractor_staff')
  );
