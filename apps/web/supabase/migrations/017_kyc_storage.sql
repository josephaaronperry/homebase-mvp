-- Create KYC documents storage bucket
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own KYC docs
drop policy if exists "Users can upload KYC docs" on storage.objects;
create policy "Users can upload KYC docs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can view own KYC docs" on storage.objects;
create policy "Users can view own KYC docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to view all KYC docs
drop policy if exists "Admins can view all KYC docs" on storage.objects;
create policy "Admins can view all KYC docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and exists (
    select 1 from public.users where id = auth.uid() and is_admin = true
  ));

-- Ensure users.kycStatus exists for buyer KYC flow
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'kycStatus') then
    alter table public.users add column "kycStatus" text default 'NONE';
  end if;
end $$;
