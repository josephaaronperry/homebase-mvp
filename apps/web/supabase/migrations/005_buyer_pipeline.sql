create table if not exists public.pre_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  employment_type text,
  annual_income numeric,
  monthly_debts numeric,
  credit_score_range text,
  down_payment numeric,
  purchase_timeline text,
  estimated_min numeric,
  estimated_max numeric,
  created_at timestamptz default now()
);
alter table public.pre_approvals enable row level security;
create policy "Users manage own pre_approvals" on public.pre_approvals for all using (auth.uid() = user_id);

create table if not exists public.buying_pipelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  property_id text references public.properties,
  offer_id uuid,
  current_stage text not null default 'pre_approval',
  stage_completed_at jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.buying_pipelines enable row level security;
create policy "Users manage own pipelines" on public.buying_pipelines for all using (auth.uid() = user_id);

create table if not exists public.lender_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pipeline_id uuid references public.buying_pipelines,
  lender_name text,
  loan_type text,
  rate numeric,
  estimated_monthly_payment numeric,
  created_at timestamptz default now()
);
alter table public.lender_selections enable row level security;
create policy "Users manage own lender_selections" on public.lender_selections for all using (auth.uid() = user_id);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pipeline_id uuid references public.buying_pipelines,
  inspector_name text,
  scheduled_date text,
  time_slot text,
  price numeric,
  status text default 'scheduled',
  created_at timestamptz default now()
);
alter table public.inspections enable row level security;
create policy "Users manage own inspections" on public.inspections for all using (auth.uid() = user_id);
