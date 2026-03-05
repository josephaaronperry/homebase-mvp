do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'preApprovalStatus') then
    alter table public.users add column "preApprovalStatus" text default 'NONE';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'preApprovalAmount') then
    alter table public.users add column "preApprovalAmount" numeric;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'preApprovalExpiry') then
    alter table public.users add column "preApprovalExpiry" date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'preApprovalLender') then
    alter table public.users add column "preApprovalLender" text;
  end if;
end $$;
