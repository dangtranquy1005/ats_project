BEGIN;
DO $$
DECLARE fixture_user bigint;
BEGIN
  SELECT id INTO fixture_user FROM tbl_users
  WHERE email='m4-ui-20261125@example.invalid' AND full_name='M4 UI fixture';
  IF fixture_user IS NULL THEN RETURN; END IF;
  IF EXISTS(SELECT 1 FROM tbl_cv c JOIN tbl_job j ON j.job_id=c.job_desc_id WHERE j.user_id=fixture_user) THEN
    RAISE EXCEPTION 'Fixture still has CVs; abort cleanup';
  END IF;
  DELETE FROM tbl_job_required_skill WHERE job_posting_id IN (SELECT job_id FROM tbl_job WHERE user_id=fixture_user);
  DELETE FROM tbl_job WHERE user_id=fixture_user;
  DELETE FROM tbl_users WHERE id=fixture_user;
END $$;
COMMIT;
