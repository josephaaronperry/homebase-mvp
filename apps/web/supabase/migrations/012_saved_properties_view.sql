alter table public.saved_properties enable row level security;
drop policy if exists "Users manage own saved properties" on public.saved_properties;
create policy "Users manage own saved properties" on public.saved_properties
  for all using (auth.uid()::text = "userId");
