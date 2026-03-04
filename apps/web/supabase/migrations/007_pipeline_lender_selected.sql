alter table public.buying_pipelines drop constraint if exists buying_pipelines_current_stage_check;
alter table public.buying_pipelines add constraint buying_pipelines_current_stage_check
  check (current_stage in ('pre_approval','offer_submitted','offer_accepted','inspection_booked','appraisal','lender_selected','lender_selection','loan_processing','clear_to_close','closing'));
