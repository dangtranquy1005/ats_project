BEGIN;

ALTER TABLE public.tbl_cv
    ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS pdf_processing_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS pdf_processing_started_at TIMESTAMP;

UPDATE public.tbl_cv SET updated_at = uploaded_at WHERE updated_at IS NULL;

-- Đồng bộ các trường kết quả mà quan hệ CV.matchResult sử dụng.
ALTER TABLE public.tbl_match_result
    ADD COLUMN IF NOT EXISTS details_json TEXT,
    ADD COLUMN IF NOT EXISTS algorithm_version VARCHAR(255);

CREATE TABLE IF NOT EXISTS public.tbl_pending_upload_cleanup (
    file_path VARCHAR(500) PRIMARY KEY,
    eligible_at TIMESTAMP NOT NULL,
    cleanup_token VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_pending_upload_cleanup_due
    ON public.tbl_pending_upload_cleanup (eligible_at);

COMMIT;
