DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'buying_pipelines') THEN
    ALTER TABLE public.buying_pipelines DROP CONSTRAINT IF EXISTS buying_pipelines_current_stage_check;
  END IF;
END $$;
