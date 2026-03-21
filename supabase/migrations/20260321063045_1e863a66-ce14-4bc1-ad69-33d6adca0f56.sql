
-- Extend check_profile_update_allowed to also protect system-owned fields:
-- suspended_until, points, points_social, daily_swipes_count, last_swipe_reset, aya_messages_used
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed(
  p_user_id uuid,
  p_new_status text,
  p_new_is_verified boolean,
  p_new_is_premium boolean
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin(p_user_id) THEN
    RETURN true;
  END IF;

  RETURN (
    SELECT
      p_new_status = profiles.status
      AND p_new_is_verified = profiles.is_verified
      AND p_new_is_premium = profiles.is_premium
    FROM public.profiles
    WHERE profiles.user_id = p_user_id
  );
END;
$$;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND check_profile_update_allowed(auth.uid(), status, is_verified, is_premium)
  AND suspended_until IS NOT DISTINCT FROM (SELECT p.suspended_until FROM public.profiles p WHERE p.user_id = auth.uid())
  AND points            = (SELECT p.points            FROM public.profiles p WHERE p.user_id = auth.uid())
  AND points_social     = (SELECT p.points_social     FROM public.profiles p WHERE p.user_id = auth.uid())
  AND daily_swipes_count = (SELECT p.daily_swipes_count FROM public.profiles p WHERE p.user_id = auth.uid())
  AND last_swipe_reset  = (SELECT p.last_swipe_reset  FROM public.profiles p WHERE p.user_id = auth.uid())
  AND aya_messages_used = (SELECT p.aya_messages_used FROM public.profiles p WHERE p.user_id = auth.uid())
);
