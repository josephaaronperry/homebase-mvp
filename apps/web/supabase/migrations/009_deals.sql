alter table public.properties add column if not exists seller_id uuid references auth.users;
alter table public.offers add column if not exists property_id text references public.properties;
alter table public.offers add column if not exists buyer_id uuid references auth.users;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties not null,
  offer_id text references public.offers not null,
  buyer_id uuid references auth.users not null,
  seller_id uuid references auth.users not null,
  agreed_price numeric not null,
  status text not null default 'active',
  lender_id uuid references public.lender_selections,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.deals enable row level security;
create policy "Buyers and sellers can view own deals" on public.deals
  for all using (auth.uid() = buyer_id or auth.uid() = seller_id);
