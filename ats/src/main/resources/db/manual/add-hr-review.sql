-- Chạy trước khi khởi động bản backend mốc 4. Có thể chạy lại an toàn.
BEGIN;
ALTER TABLE tbl_cv ADD COLUMN IF NOT EXISTS hr_review_status varchar(24) NOT NULL DEFAULT 'PENDING';
ALTER TABLE tbl_cv ADD COLUMN IF NOT EXISTS hr_note text NOT NULL DEFAULT '';
ALTER TABLE tbl_cv ADD COLUMN IF NOT EXISTS hr_reviewed_at timestamp;
ALTER TABLE tbl_cv ADD COLUMN IF NOT EXISTS hr_review_version bigint NOT NULL DEFAULT 0;
-- Dữ liệu REVIEWED của phiên bản cũ được giữ ý nghĩa đã chọn vào danh sách.
UPDATE tbl_cv SET hr_review_status = 'SHORTLISTED'
WHERE status = 'REVIEWED' AND hr_review_status = 'PENDING' AND hr_review_version = 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_cv_hr_review_status' AND conrelid = 'tbl_cv'::regclass) THEN
    ALTER TABLE tbl_cv ADD CONSTRAINT ck_cv_hr_review_status CHECK (hr_review_status IN ('PENDING', 'SHORTLISTED', 'REJECTED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_cv_hr_review_version' AND conrelid = 'tbl_cv'::regclass) THEN
    ALTER TABLE tbl_cv ADD CONSTRAINT ck_cv_hr_review_version CHECK (hr_review_version >= 0);
  END IF;
END $$;
COMMIT;
