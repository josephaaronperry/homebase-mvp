-- Remove the unique constraint on user_id so users can have multiple submissions
-- (e.g. resubmit after rejection, or submit both buyer KYC and pre-approval)
alter table public.kyc_submissions drop constraint if exists kyc_submissions_user_id_key;
