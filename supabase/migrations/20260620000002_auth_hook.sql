-- JWT カスタムクレーム hook
-- ログイン時に company_id と role を JWT の app_metadata に追加する
-- config.toml の [auth.hook.custom_access_token] で登録済み

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims          jsonb;
  user_company_id uuid;
  user_role       text;
begin
  select company_id, role
    into user_company_id, user_role
    from public.users
   where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_company_id is not null then
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      coalesce(claims -> 'app_metadata', '{}'::jsonb)
      || jsonb_build_object(
           'company_id', user_company_id,
           'role',       user_role
         )
    );
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage  on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
