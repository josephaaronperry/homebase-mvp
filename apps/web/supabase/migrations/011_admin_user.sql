alter table public.profiles add column if not exists is_admin boolean default false;
update public.profiles set is_admin = true where id = (
  select id from auth.users where email = 'joseph.aaron.perry@gmail.com'
);
