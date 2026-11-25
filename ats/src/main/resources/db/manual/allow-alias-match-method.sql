-- Chạy trên database ATS đã có bảng tbl_cv_skills.
-- Cho phép lưu phương thức ALIAS do NLP trả về, đồng thời hỗ trợ dữ liệu cũ.
BEGIN;

ALTER TABLE public.tbl_cv_skills
    DROP CONSTRAINT IF EXISTS tbl_cv_skills_match_method_check;

ALTER TABLE public.tbl_cv_skills
    ADD CONSTRAINT tbl_cv_skills_match_method_check
    CHECK (match_method IN ('EXACT', 'ALIAS', 'FUZZY'));

COMMIT;
