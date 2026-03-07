
-- ============================================================
-- 2. Hash tokens: enable pgcrypto, add token_hash column,
--    migrate existing data, add trigger to auto-hash on INSERT
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add token_hash column (stores SHA-256 hex of the token)
ALTER TABLE public.student_email_verifications
  ADD COLUMN IF NOT EXISTS token_hash text;

-- Backfill existing rows
UPDATE public.student_email_verifications
SET token_hash = encode(digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL;

-- Make token_hash NOT NULL and unique
ALTER TABLE public.student_email_verifications
  ALTER COLUMN token_hash SET NOT NULL;

ALTER TABLE public.student_email_verifications
  DROP CONSTRAINT IF EXISTS student_email_verifications_token_hash_key;
ALTER TABLE public.student_email_verifications
  ADD CONSTRAINT student_email_verifications_token_hash_key UNIQUE (token_hash);

-- Clear plaintext tokens from existing rows (replace with empty string placeholder)
UPDATE public.student_email_verifications
SET token = '***';

-- Trigger: auto-hash token on INSERT, clear plaintext immediately
CREATE OR REPLACE FUNCTION public.hash_verification_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.token_hash := encode(digest(NEW.token, 'sha256'), 'hex');
  NEW.token := '***'; -- never persist plaintext
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hash_verification_token_trigger ON public.student_email_verifications;
CREATE TRIGGER hash_verification_token_trigger
BEFORE INSERT ON public.student_email_verifications
FOR EACH ROW EXECUTE FUNCTION public.hash_verification_token();
