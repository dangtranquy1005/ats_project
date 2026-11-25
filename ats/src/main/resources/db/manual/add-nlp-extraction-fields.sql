-- Bổ sung trường cho phản hồi NLP. Dữ liệu cũ giữ NULL khi không biết độ chính xác.
BEGIN;

ALTER TABLE public.tbl_cv_experience
    ADD COLUMN IF NOT EXISTS start_date_precision VARCHAR(255),
    ADD COLUMN IF NOT EXISTS end_date_precision VARCHAR(255),
    ADD COLUMN IF NOT EXISTS source_text TEXT;

ALTER TABLE public.tbl_cv_education
    ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
    ADD COLUMN IF NOT EXISTS source_text TEXT;

COMMIT;
