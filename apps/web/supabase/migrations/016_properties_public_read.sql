-- Allow anyone to read active properties (public listings)
drop policy if exists "Anyone can view active properties" on public.properties;
create policy "Anyone can view active properties"
  on public.properties for select
  using (true);
