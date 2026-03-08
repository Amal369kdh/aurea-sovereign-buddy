
-- Add suspended_until column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone DEFAULT NULL;

-- Allow admins to read ALL profiles (for moderation)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'admin'
    )
  );

-- Allow admins to update ALL profiles (for suspension/warning)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'admin'
    )
  );

-- Allow admins to read ALL reports
CREATE POLICY "Admins can read all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'admin'
    )
  );

-- Allow admins to update reports (change status)
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'admin'
    )
  );

-- Allow admins to delete any announcement
CREATE POLICY "Admins can delete any announcement"
  ON public.announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'admin'
    )
  );

-- Allow admins to insert announcements with is_pinned = true
CREATE POLICY "Admins can insert pinned announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'admin'
    )
  );
