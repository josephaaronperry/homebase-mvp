-- Seller listings: link users to their listed properties
-- Also ensure properties has user_id for seller-created listings

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'user_id') then
    alter table public.properties add column user_id uuid references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'zip_code') then
    alter table public.properties add column zip_code text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'year_built') then
    alter table public.properties add column year_built int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'lot_size') then
    alter table public.properties add column lot_size decimal(12, 2);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'features') then
    alter table public.properties add column features jsonb default '{}';
  end if;
end $$;

-- Allow authenticated users to insert/update their own properties (seller listings)
drop policy if exists "Authenticated insert own properties" on public.properties;
create policy "Authenticated insert own properties"
  on public.properties for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated update own properties" on public.properties;
create policy "Authenticated update own properties"
  on public.properties for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.seller_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null default 'pending_review' check (status in ('pending_review', 'active', 'sold', 'withdrawn')),
  created_at timestamptz default now()
);

create index if not exists seller_listings_user_id_idx on public.seller_listings(user_id);
create index if not exists seller_listings_property_id_idx on public.seller_listings(property_id);
alter table public.seller_listings enable row level security;

drop policy if exists "Users read own seller_listings" on public.seller_listings;
create policy "Users read own seller_listings" on public.seller_listings for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own seller_listings" on public.seller_listings;
create policy "Users insert own seller_listings" on public.seller_listings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own seller_listings" on public.seller_listings;
create policy "Users update own seller_listings" on public.seller_listings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
