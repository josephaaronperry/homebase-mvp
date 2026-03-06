-- Add pre_approval_amount to kyc_submissions for pre-approval letter path
alter table public.kyc_submissions add column if not exists pre_approval_amount numeric;
