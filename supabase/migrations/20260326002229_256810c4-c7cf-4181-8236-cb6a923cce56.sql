
-- Function to check if bypass_student_verification flag is active
CREATE OR REPLACE FUNCTION public.is_bypass_verification_active()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.feature_flags
    WHERE key = 'bypass_student_verification' AND enabled = true
  )
$$;

-- Drop and recreate INSERT policy on announcements to include bypass check
DROP POLICY IF EXISTS "Verified users can create announcements" ON public.announcements;
CREATE POLICY "Verified users can create announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (
  (author_id = auth.uid()) AND (
    is_temoin(auth.uid()) OR is_admin(auth.uid()) OR is_bypass_verification_active()
  )
);

-- Drop and recreate INSERT policy on comments to include bypass check
DROP POLICY IF EXISTS "Verified users can create comments" ON public.comments;
CREATE POLICY "Verified users can create comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (
  (author_id = auth.uid()) AND (
    is_temoin(auth.uid()) OR is_admin(auth.uid()) OR is_bypass_verification_active()
  )
);

-- Also update likes policies for bypass
DROP POLICY IF EXISTS "Verified users can like" ON public.announcement_likes;
CREATE POLICY "Verified users can like"
ON public.announcement_likes FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid()) AND (
    is_temoin(auth.uid()) OR is_admin(auth.uid()) OR is_bypass_verification_active()
  )
);

DROP POLICY IF EXISTS "Verified users can unlike" ON public.announcement_likes;
CREATE POLICY "Verified users can unlike"
ON public.announcement_likes FOR DELETE TO authenticated
USING (
  (user_id = auth.uid()) AND (
    is_temoin(auth.uid()) OR is_admin(auth.uid()) OR is_bypass_verification_active()
  )
);
