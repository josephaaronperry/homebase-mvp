alter table public.users add column if not exists is_admin boolean default false;
update public.users set is_admin = true where id = (
  select id from auth.users where email = 'joseph.aaron.perry@gmail.com'
);
