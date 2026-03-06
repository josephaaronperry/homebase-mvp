create or replace function set_user_kyc_status(user_email text, new_status text)
returns void language plpgsql security definer as $$
begin
  update public.users
  set "kycStatus" = new_status::"KycStatus"
  where email = user_email;
end;
$$;
