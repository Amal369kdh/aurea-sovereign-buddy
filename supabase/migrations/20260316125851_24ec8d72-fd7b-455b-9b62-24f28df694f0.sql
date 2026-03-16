-- Drop the trigger that calls digest() from pgcrypto (extension not installed)
-- The Edge Function verify-student-email already handles SHA-256 hashing via crypto.subtle
-- and stores the hash directly in token_hash, so this trigger is redundant and broken.

DROP TRIGGER IF EXISTS hash_verification_token_trigger ON public.student_email_verifications;
DROP TRIGGER IF EXISTS before_insert_verification ON public.student_email_verifications;

-- Also drop the broken function since it's no longer needed
DROP FUNCTION IF EXISTS public.hash_verification_token() CASCADE;