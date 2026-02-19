
-- Table to store student email verification tokens
CREATE TABLE public.student_email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.student_email_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verifications
CREATE POLICY "Users can read own verifications"
ON public.student_email_verifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own verification requests
CREATE POLICY "Users can create own verification"
ON public.student_email_verifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Service role (edge functions) can update verifications - no user policy needed
-- Edge functions use service role key to update verified status

-- Index for fast token lookup
CREATE INDEX idx_verification_token ON public.student_email_verifications(token);
CREATE INDEX idx_verification_user ON public.student_email_verifications(user_id);
