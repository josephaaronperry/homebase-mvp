-- Enable Row Level Security on the properties table
alter table public.properties enable row level security;

-- Allow anonymous (anon role) public read access to properties
create policy "Public read access for properties"
  on public.properties
  for select
  to anon
  using (true);

