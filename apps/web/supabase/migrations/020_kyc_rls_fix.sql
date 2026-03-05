alter table public.kyc_submissions enable row level security;

create policy "Users can insert own KYC submissions"
  on public.kyc_submissions for insert to authenticated
  with check (user_id::text = auth.uid()::text);

create policy "Users can view own KYC submissions"
  on public.kyc_submissions for select to authenticated
  using (user_id::text = auth.uid()::text);

create policy "Admins can view all KYC submissions"
  on public.kyc_submissions for select to authenticated
  using (exists (
    select 1 from public.users u where u.id::text = auth.uid()::text and u.is_admin = true
  ));

create policy "Admins can update KYC submissions"
  on public.kyc_submissions for update to authenticated
  using (exists (
    select 1 from public.users u where u.id::text = auth.uid()::text and u.is_admin = true
  ));
