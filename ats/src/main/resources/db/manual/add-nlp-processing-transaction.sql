BEGIN;

ALTER TABLE public.tbl_cv
    ADD COLUMN IF NOT EXISTS nlp_processing_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nlp_processing_started_at TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.tbl_cv_skills'::regclass AND conname = 'uk_cv_skill'
    ) THEN
        ALTER TABLE public.tbl_cv_skills ADD CONSTRAINT uk_cv_skill UNIQUE (cv_id, skill_id);
    END IF;
END $$;

COMMIT;
