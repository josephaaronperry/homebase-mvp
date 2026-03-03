-- KYC submissions table for identity verification
create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  full_name text,
  dob date,
  ssn_last4 text,
  address text,
  id_type text,
  id_front_url text,
  id_back_url text,
  funds_doc_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists kyc_submissions_user_id_idx on public.kyc_submissions(user_id);
create unique index if not exists kyc_submissions_user_latest_idx on public.kyc_submissions(user_id, created_at desc);

alter table public.kyc_submissions enable row level security;

drop policy if exists "Users read own kyc_submissions" on public.kyc_submissions;
create policy "Users read own kyc_submissions"
  on public.kyc_submissions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own kyc_submissions" on public.kyc_submissions;
create policy "Users insert own kyc_submissions"
  on public.kyc_submissions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own kyc_submissions" on public.kyc_submissions;
create policy "Users update own kyc_submissions"
  on public.kyc_submissions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add tour_type and notes to showings if not present
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='showings' and column_name='tour_type') then
    alter table public.showings add column tour_type text default 'IN_PERSON';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='showings' and column_name='notes') then
    alter table public.showings add column notes text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='showings' and column_name='scheduled_at') then
    alter table public.showings add column scheduled_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='showings' and column_name='property_address') then
    alter table public.showings add column property_address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='showings' and column_name='property_city') then
    alter table public.showings add column property_city text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='showings' and column_name='property_state') then
    alter table public.showings add column property_state text;
  end if;
end $$;

-- Ensure offers table has required columns for offer wizard
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='earnest_money') then
    alter table public.offers add column earnest_money decimal(12,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='closing_date') then
    alter table public.offers add column closing_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='financing_type') then
    alter table public.offers add column financing_type text default 'CONVENTIONAL';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='down_payment_pct') then
    alter table public.offers add column down_payment_pct decimal(5,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='pre_approval_url') then
    alter table public.offers add column pre_approval_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='contingencies') then
    alter table public.offers add column contingencies jsonb default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='message_to_seller') then
    alter table public.offers add column message_to_seller text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='offers' and column_name='property_id') then
    alter table public.offers add column property_id uuid;
  end if;
end $$;
