-- auth hook 修正
-- 旧定義は security definer でなく、supabase_auth_admin が public.users を
-- 参照する際 RLS でブロックされ "Error running hook URI" となっていた。
-- security definer（所有者 postgres 権限で実行 → RLS バイパス）に変更する。

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
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
