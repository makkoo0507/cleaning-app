-- company_id → contractor_id リネーム後の auth_hook・RLS ヘルパー修正

-- auth hook: company_id → contractor_id
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims            jsonb;
  user_contractor_id uuid;
  user_role         text;
begin
  select contractor_id, role
    into user_contractor_id, user_role
    from public.users
   where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_contractor_id is not null then
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      coalesce(claims -> 'app_metadata', '{}'::jsonb)
      || jsonb_build_object(
           'contractor_id', user_contractor_id,
           'role',          user_role
         )
    );
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- RLS ヘルパー: JWT から contractor_id を取り出す
create or replace function public.my_company_id() returns uuid as $$
  select (auth.jwt() -> 'app_metadata' ->> 'contractor_id')::uuid;
$$ language sql stable security definer;
