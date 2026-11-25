-- Cho phép lưu thông tin trích xuất chưa xác định được dưới dạng NULL.
BEGIN;

ALTER TABLE public.tbl_cv
    ALTER COLUMN candidate_name DROP NOT NULL,
    ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.tbl_cv_experience
    ALTER COLUMN company_name DROP NOT NULL,
    ALTER COLUMN job_title DROP NOT NULL;

ALTER TABLE public.tbl_cv_education
    ALTER COLUMN institution DROP NOT NULL,
    ALTER COLUMN degree DROP NOT NULL;

COMMIT;
