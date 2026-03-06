-- Allow admins to update users.kycStatus via RLS
drop policy if exists "Admins can update user kycStatus" on public.users;
create policy "Admins can update user kycStatus" on public.users
  for update to authenticated
  using (exists (
    select 1 from public.users u where u.id::text = auth.uid()::text and u.is_admin = true
  ));
