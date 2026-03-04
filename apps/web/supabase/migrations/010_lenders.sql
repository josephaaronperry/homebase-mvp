create table if not exists public.lenders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  loan_type text not null,
  apr numeric not null,
  points numeric default 0,
  monthly_payment_per_100k numeric,
  min_down_payment_pct numeric default 3,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.lenders enable row level security;
create policy "Anyone can view active lenders" on public.lenders
  for select using (active = true);

insert into public.lenders (name, loan_type, apr, points, monthly_payment_per_100k) values
  ('Rocket Mortgage', '30-Year Fixed', 6.75, 0, 648),
  ('Better.com', '30-Year Fixed', 6.49, 0.5, 631),
  ('Chase Home Lending', '15-Year Fixed', 6.12, 0, 849),
  ('loanDepot', 'FHA 30-Year', 6.25, 0, 615);
