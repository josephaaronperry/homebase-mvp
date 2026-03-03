-- Buyer transaction funnel: pre_approvals, buying_pipelines, lender_selections, inspections

-- pre_approvals: store buyer pre-approval form data and estimated range
create table if not exists public.pre_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employment_type text not null,
  annual_income decimal(14, 2) not null,
  monthly_debts decimal(12, 2) not null default 0,
  credit_score_range text not null,
  down_payment_amount decimal(14, 2) not null,
  purchase_timeline text not null,
  estimated_min decimal(14, 2),
  estimated_max decimal(14, 2),
  created_at timestamptz default now()
);

create index if not exists pre_approvals_user_id_idx on public.pre_approvals(user_id);
alter table public.pre_approvals enable row level security;

drop policy if exists "Users read own pre_approvals" on public.pre_approvals;
create policy "Users read own pre_approvals" on public.pre_approvals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own pre_approvals" on public.pre_approvals;
create policy "Users insert own pre_approvals" on public.pre_approvals for insert to authenticated with check (auth.uid() = user_id);

-- buying_pipelines: one per property the buyer is pursuing; tracks pipeline stage
create table if not exists public.buying_pipelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  current_stage text not null default 'pre_approval' check (current_stage in (
    'pre_approval', 'offer_submitted', 'offer_accepted', 'inspection_booked',
    'appraisal', 'lender_selection', 'loan_processing', 'clear_to_close', 'closing'
  )),
  stage_completed_at jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, property_id)
);

create index if not exists buying_pipelines_user_id_idx on public.buying_pipelines(user_id);
create index if not exists buying_pipelines_property_id_idx on public.buying_pipelines(property_id);
alter table public.buying_pipelines enable row level security;

drop policy if exists "Users read own buying_pipelines" on public.buying_pipelines;
create policy "Users read own buying_pipelines" on public.buying_pipelines for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own buying_pipelines" on public.buying_pipelines;
create policy "Users insert own buying_pipelines" on public.buying_pipelines for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own buying_pipelines" on public.buying_pipelines;
create policy "Users update own buying_pipelines" on public.buying_pipelines for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- lender_selections: which lender the buyer selected for a pipeline
create table if not exists public.lender_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  buying_pipeline_id uuid not null references public.buying_pipelines(id) on delete cascade,
  lender_name text not null,
  lender_loan_type text,
  interest_rate decimal(5, 2),
  estimated_monthly_payment decimal(12, 2),
  selected_at timestamptz default now(),
  unique(buying_pipeline_id)
);

create index if not exists lender_selections_user_id_idx on public.lender_selections(user_id);
alter table public.lender_selections enable row level security;

drop policy if exists "Users read own lender_selections" on public.lender_selections;
create policy "Users read own lender_selections" on public.lender_selections for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own lender_selections" on public.lender_selections;
create policy "Users insert own lender_selections" on public.lender_selections for insert to authenticated with check (auth.uid() = user_id);

-- inspections: booked inspection for a pipeline
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  buying_pipeline_id uuid not null references public.buying_pipelines(id) on delete cascade,
  inspector_name text not null,
  inspector_rating decimal(3, 1),
  price decimal(10, 2),
  scheduled_date date not null,
  time_slot text not null,
  created_at timestamptz default now()
);

create index if not exists inspections_user_id_idx on public.inspections(user_id);
create index if not exists inspections_pipeline_id_idx on public.inspections(buying_pipeline_id);
alter table public.inspections enable row level security;

drop policy if exists "Users read own inspections" on public.inspections;
create policy "Users read own inspections" on public.inspections for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own inspections" on public.inspections;
create policy "Users insert own inspections" on public.inspections for insert to authenticated with check (auth.uid() = user_id);
