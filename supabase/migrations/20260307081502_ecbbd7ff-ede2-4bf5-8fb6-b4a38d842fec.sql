-- Drop token column from student_email_verifications (keep only token_hash)
ALTER TABLE public.student_email_verifications
DROP COLUMN token;