
-- 1. Reports table for ultra-fast reporting
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_announcement_id uuid REFERENCES public.announcements(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can only create reports (not read/update/delete)
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Users can see their own reports only
CREATE POLICY "Users can read own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

-- 2. Security definer: check if a user has Témoin status
CREATE OR REPLACE FUNCTION public.is_temoin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND status = 'temoin'
  )
$$;

-- 3. Restrict private messages to Témoin users only
-- Drop existing permissive INSERT policy
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- New: only Témoin users can send messages, and only to other Témoin users
CREATE POLICY "Témoins can send messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_id <> receiver_id
    AND public.is_temoin(auth.uid())
    AND public.is_temoin(receiver_id)
  );

-- Also restrict reading to Témoin
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;

CREATE POLICY "Témoins can read own messages" ON public.messages
  FOR SELECT
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND public.is_temoin(auth.uid())
  );

-- Restrict delete to Témoin sender
DROP POLICY IF EXISTS "Users can delete own sent messages" ON public.messages;

CREATE POLICY "Témoins can delete own messages" ON public.messages
  FOR DELETE
  USING (sender_id = auth.uid() AND public.is_temoin(auth.uid()));
