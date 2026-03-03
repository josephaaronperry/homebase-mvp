-- Batch 4: Property views tracking and view_count

-- Add view_count to properties if not exists
alter table public.properties
  add column if not exists view_count integer default 0;

-- Create property_views table
create table if not exists public.property_views (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now(),
  ip_address inet
);

create index if not exists property_views_property_id_idx on public.property_views(property_id);
create index if not exists property_views_viewed_at_idx on public.property_views(viewed_at);

alter table public.property_views enable row level security;

-- Allow inserts from anon and authenticated (for tracking)
create policy "Allow insert property_views"
  on public.property_views
  for insert
  to anon, authenticated
  with check (true);

-- Only service role or authenticated users can read (for analytics)
create policy "Authenticated read property_views"
  on public.property_views
  for select
  to authenticated
  using (true);

-- Trigger: increment view_count on insert to property_views
create or replace function public.increment_property_view_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.properties
  set view_count = coalesce(view_count, 0) + 1
  where id = new.property_id;
  return new;
end;
$$;

drop trigger if exists property_views_increment_count on public.property_views;

create trigger property_views_increment_count
  after insert
  on public.property_views
  for each row
  execute function public.increment_property_view_count();
