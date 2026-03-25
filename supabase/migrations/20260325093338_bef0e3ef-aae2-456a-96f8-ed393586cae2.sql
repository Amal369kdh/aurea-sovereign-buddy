
-- Renforcement de la protection des champs système dans la politique UPDATE de profiles
-- On reconstruit la politique pour protéger explicitement tous les champs système

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
  AND points = (SELECT p.points FROM public.profiles p WHERE p.user_id = auth.uid())
  AND points_social = (SELECT p.points_social FROM public.profiles p WHERE p.user_id = auth.uid())
  AND daily_swipes_count = (SELECT p.daily_swipes_count FROM public.profiles p WHERE p.user_id = auth.uid())
  AND last_swipe_reset = (SELECT p.last_swipe_reset FROM public.profiles p WHERE p.user_id = auth.uid())
  AND aya_messages_used = (SELECT p.aya_messages_used FROM public.profiles p WHERE p.user_id = auth.uid())
  AND integration_progress = (SELECT p.integration_progress FROM public.profiles p WHERE p.user_id = auth.uid())
);
