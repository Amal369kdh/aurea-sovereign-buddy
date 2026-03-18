-- Fix RLS on dating_profiles: allow users to read their OWN profile regardless of is_active
DROP POLICY IF EXISTS "Authenticated can read active dating profiles" ON public.dating_profiles;

-- Re-create: active profiles visible to authenticated + own profile always visible
CREATE POLICY "Authenticated can read active dating profiles"
  ON public.dating_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true OR user_id = auth.uid());