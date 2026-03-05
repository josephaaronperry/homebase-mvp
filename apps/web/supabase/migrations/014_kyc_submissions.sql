-- Add columns to kyc_submissions for proof document and phone
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'phone') then
    alter table public.kyc_submissions add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'proof_url') then
    alter table public.kyc_submissions add column proof_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'proof_type') then
    alter table public.kyc_submissions add column proof_type text;
  end if;
end $$;
