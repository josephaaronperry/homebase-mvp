-- Add submission_type (buyer | seller) and seller-specific columns to kyc_submissions
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'submission_type') then
    alter table public.kyc_submissions add column submission_type text default 'buyer';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'ownership_doc_url') then
    alter table public.kyc_submissions add column ownership_doc_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'ownership_property_address') then
    alter table public.kyc_submissions add column ownership_property_address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kyc_submissions' and column_name = 'listing_agreement_signed_at') then
    alter table public.kyc_submissions add column listing_agreement_signed_at timestamptz;
  end if;
end $$;
