-- Profiles table for user display name, phone, avatar (id = auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Allow service role / admin to read all profiles (for admin panel we'll use anon key - so we need a way for admins to see profiles; without a backend we can only show profiles that exist. For admin "users" we could use a view that joins profiles with kyc status. Here we only allow users to read/update own. Admin panel will need to list users - we don't have a public way to list all auth.users. So admin "Users" tab can show profiles table: anyone who has a profile row. Enable read for authenticated so that... no, that would let any user read any profile. So keep RLS: users only own. For admin we need either a postgres function called with elevated role or we show data we have. Simplest: admin panel "Users" tab queries profiles - but RLS will restrict to current user only. So we need an exception: allow read all profiles for admin. That's typically done by checking admin role in a policy. We don't have roles in auth. So alternative: create a view or function that returns profiles for admin emails. In Supabase we can use a function with security definer. For now, let's keep it simple: admin "Users" tab will show users we can get from other tables - e.g. distinct user_ids from offers, kyc_submissions, seller_listings, and join to profiles where available. So we'll need to query profiles for those user ids (we can't list all). Actually the user said "show all users from the profiles table (or auth metadata)". So they're okay with "profiles table" - and if we have RLS that only allows reading own profile, the admin (a logged-in user) can only read their own. To let admin read all profiles we need a policy like: (auth.uid() = id) OR (auth.jwt() ->> 'email' = any(admin_emails). We can't easily do that in SQL without a table of admin emails. Simpler approach: create a table admin_emails (email text primary key) and in RLS for profiles select: (auth.uid() = id) OR (exists (select 1 from admin_emails where email = auth.jwt() ->> 'email')). That way admin can read all profiles. Let me add that.
-- Optional: allow admins to read all profiles (requires admin_emails table)
-- We'll skip that for now and in the admin panel "Users" tab we'll fetch profiles for user_ids we get from offers/kyc/seller_listings and show whatever we have. So we need to get list of user_ids from somewhere. Actually the simplest is: in the app, when an admin loads the Users tab, we call an API route or we query a view. Supabase doesn't give us auth.users. So "Users" tab could show: from kyc_submissions join to get user_id, then we'd need to get email - we don't have email in profiles unless we store it. So let's add email to profiles and update it on login or profile save. Then admin can't list all profiles due to RLS. So we need one of: (1) Server-side API that uses service role to list users, (2) RLS policy that allows admin to read all. For (2) we need a way to identify admin. Common pattern: create table public.admin_emails (email text primary key). Insert admin emails. Then policy: select on profiles allowed if auth.uid() = id OR (select email from admin_emails where email = auth.jwt() ->> 'email'). But auth.jwt() might not be available in RLS - it is, it's auth.email() in Supabase. So: create table admin_emails (email text primary key); insert into admin_emails values ('admin@homebase.com'), ('admin@example.com'); then policy: for select to authenticated using (id = auth.uid() or auth.email() in (select email from admin_emails)). Let me add that.
create table if not exists public.admin_emails (
  email text primary key
);

insert into public.admin_emails (email) values ('admin@homebase.com'), ('admin@example.com')
  on conflict (email) do nothing;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated
  using (auth.uid() = id or (select count(*) from public.admin_emails where email = auth.email()) > 0);
