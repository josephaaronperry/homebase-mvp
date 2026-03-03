-- Batch 4: Complete RLS setup for all tables
-- Run after base schema exists (properties, saved_properties, showings, offers, notifications, users/profile)

-- Properties: public read access for everyone
alter table public.properties enable row level security;

drop policy if exists "Public read access for properties" on public.properties;
create policy "Public read access for properties"
  on public.properties
  for select
  to anon, authenticated
  using (true);

-- Saved properties: users can read/write their own
alter table public.saved_properties enable row level security;

drop policy if exists "Users read own saved_properties" on public.saved_properties;
create policy "Users read own saved_properties"
  on public.saved_properties
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own saved_properties" on public.saved_properties;
create policy "Users insert own saved_properties"
  on public.saved_properties
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own saved_properties" on public.saved_properties;
create policy "Users delete own saved_properties"
  on public.saved_properties
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Showings: users can read/write their own
alter table public.showings enable row level security;

drop policy if exists "Users read own showings" on public.showings;
create policy "Users read own showings"
  on public.showings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own showings" on public.showings;
create policy "Users insert own showings"
  on public.showings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own showings" on public.showings;
create policy "Users update own showings"
  on public.showings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own showings" on public.showings;
create policy "Users delete own showings"
  on public.showings
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Offers: users can read/write their own
alter table public.offers enable row level security;

drop policy if exists "Users read own offers" on public.offers;
create policy "Users read own offers"
  on public.offers
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own offers" on public.offers;
create policy "Users insert own offers"
  on public.offers
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own offers" on public.offers;
create policy "Users update own offers"
  on public.offers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own offers" on public.offers;
create policy "Users delete own offers"
  on public.offers
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Notifications: users can read their own
alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profiles: users can read/update their own (optional table)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
