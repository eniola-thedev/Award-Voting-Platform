-- Run this AFTER creating a user in Supabase Auth (dashboard > Authentication > Users > Add user).
-- Then run: select public.make_admin('the-email-you-used@example.com');
create or replace function public.make_admin(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    raise exception 'No auth user found with email %. Create the user first in Supabase Auth.', p_email;
  end if;

  insert into public.profiles (id, name, email, role)
  values (v_user_id, split_part(p_email, '@', 1), p_email, 'admin')
  on conflict (id) do update set email = excluded.email;
end;
$$;
