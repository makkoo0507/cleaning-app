-- ローカル開発用シードデータ
-- 本番には適用しない（db push はマイグレーションのみ反映、seed.sql は db reset 時のみ）
--
-- 管理者ログイン:
--   メール:     admin@example.com
--   パスワード: password123

-- テスト会社（有料プラン: 上限なし）
-- 会社別ログインURL: /acme/login
insert into public.contractor_companies (id, name, plan, max_properties, max_cleaners, slug)
values (
  '11111111-1111-1111-1111-111111111111',
  'テスト清掃株式会社',
  'paid',
  null,
  null,
  'acme'
)
on conflict (id) do nothing;

-- 管理者の auth ユーザー
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  '', '', '', ''
)
on conflict (id) do nothing;

-- email ログイン用 identity（GoTrue が要求）
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"admin@example.com","email_verified":true}',
  'email',
  now(), now(), now()
)
on conflict (provider_id, provider) do nothing;

-- public.users（管理者プロフィール）
insert into public.users (id, contractor_id, role, name)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'contractor_admin',
  '管理者テスト'
)
on conflict (id) do nothing;

insert into public.contractor_member_profiles (user_id, department)
values ('22222222-2222-2222-2222-222222222222', '管理部')
on conflict (user_id) do nothing;

-- 請求・支払いオプションを有効化（acme は有料プラン）
insert into public.contractor_features (contractor_id, feature_key, enabled)
values ('11111111-1111-1111-1111-111111111111', 'billing', true)
on conflict (contractor_id, feature_key) do nothing;

-- ── プラットフォーム管理者（ベンダー運営）──
-- ログイン: /vendor/login   vendor@example.com / password123
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'authenticated', 'authenticated',
  'vendor@example.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values (
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  '{"sub":"44444444-4444-4444-4444-444444444444","email":"vendor@example.com","email_verified":true}',
  'email',
  now(), now(), now()
)
on conflict (provider_id, provider) do nothing;

-- 運営は業者に属さない（contractor_id = null）
insert into public.users (id, contractor_id, role, name)
values (
  '44444444-4444-4444-4444-444444444444',
  null,
  'platform_admin',
  'ベンダー運営'
)
on conflict (id) do nothing;

-- ── acme のベンダー用管理者（運営が会社管理画面へ入るための隠しアカウント）──
-- ログイン: /acme/login   vendor+acme@example.com / password123
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '55555555-5555-5555-5555-555555555555',
  'authenticated', 'authenticated',
  'vendor+acme@example.com',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}',
  '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values (
  '55555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555555',
  '{"sub":"55555555-5555-5555-5555-555555555555","email":"vendor+acme@example.com","email_verified":true}',
  'email',
  now(), now(), now()
)
on conflict (provider_id, provider) do nothing;

insert into public.users (id, contractor_id, role, name)
values (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'contractor_vendor',
  '運営管理（ベンダー）'
)
on conflict (id) do nothing;

insert into public.contractor_member_profiles (user_id)
values ('55555555-5555-5555-5555-555555555555')
on conflict (user_id) do nothing;

-- サンプル物件
insert into public.properties (id, contractor_id, name, address, notes)
values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '渋谷ステイ101', '東京都渋谷区1-1-1', 'オートロック。鍵はキーボックス #1234'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '浅草ゲストハウス', '東京都台東区2-2-2', null)
on conflict (id) do nothing;
