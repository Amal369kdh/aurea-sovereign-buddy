
-- ═══════════════════════════════════════════════════════════════════════════
-- FIX 1: Prevent admin self-promotion via profiles UPDATE
-- Problem: "Users can update own profile" allows updating ANY column including
--          `status`, letting any user set themselves to 'admin'.
-- Fix: Replace with a WITH CHECK that ensures status cannot be changed.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Function to read current status of authenticated user's own profile
-- Uses SECURITY DEFINER to bypass RLS without recursion
CREATE OR REPLACE FUNCTION public.get_own_profile_status(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE user_id = _user_id
$$;

-- Re-create user update policy: users can edit their own profile
-- but status must stay unchanged (cannot self-promote)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND status = get_own_profile_status(auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX 2: Dating profiles must require authenticated access
-- Problem: "Users can read active dating profiles" uses USING (is_active = true)
--          without checking auth — anon role can read all dating profiles.
-- Fix: Restrict to authenticated role only.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can read active dating profiles" ON public.dating_profiles;

CREATE POLICY "Authenticated can read active dating profiles"
  ON public.dating_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- FIX 3: Job posting bypass via dual INSERT policies on resources_links
-- Problem: "Users can create resources" (any category) overrides the more
--          restrictive "Only verified orgs can publish jobs" policy.
-- Fix: Drop both, replace with a single consolidated policy.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Only verified orgs can publish jobs" ON public.resources_links;
DROP POLICY IF EXISTS "Users can create resources" ON public.resources_links;

-- Helper: check if user has verified student email
CREATE OR REPLACE FUNCTION public.is_student_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND is_verified = true
  )
$$;

-- Single consolidated INSERT policy:
-- - jobs/alternance → verified organization required
-- - other categories → verified student email required
CREATE POLICY "Verified users can create resources"
  ON public.resources_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND CASE
      WHEN category IN ('jobs'::resource_category, 'alternance'::resource_category)
        THEN is_verified_organization(auth.uid())
      ELSE is_student_verified(auth.uid())
    END
  );
