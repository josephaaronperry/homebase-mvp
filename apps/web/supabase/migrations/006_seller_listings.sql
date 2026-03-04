create table if not exists public.seller_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  property_id uuid references public.properties not null,
  status text not null default 'pending_review',
  created_at timestamptz default now()
);
alter table public.seller_listings enable row level security;
create policy "Users can manage own listings" on public.seller_listings
  for all using (auth.uid() = user_id);
