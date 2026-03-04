-- Ensure saved_properties has correct schema
create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  property_id text references public.properties not null,
  created_at timestamptz default now(),
  unique(user_id, property_id)
);
alter table public.saved_properties enable row level security;
drop policy if exists "Users manage own saved properties" on public.saved_properties;
create policy "Users manage own saved properties" on public.saved_properties
  for all using (auth.uid() = user_id);
