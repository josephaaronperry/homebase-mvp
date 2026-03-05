do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'agent_license') then
    alter table public.kyc_submissions add column agent_license text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'agent_brokerage') then
    alter table public.kyc_submissions add column agent_brokerage text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'agent_license_url') then
    alter table public.kyc_submissions add column agent_license_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'client_name') then
    alter table public.kyc_submissions add column client_name text;
  end if;
end $$;
