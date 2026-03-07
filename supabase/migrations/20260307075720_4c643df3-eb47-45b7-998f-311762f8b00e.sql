
-- ============================================================
-- 3. Restrict organizations: owner-only SELECT
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can read organizations" ON public.organizations;

-- Allow only the owner to read their own org
CREATE POLICY "Owners can read own organization"
ON public.organizations
FOR SELECT
USING (user_id = auth.uid());

-- The is_verified_organization() function is SECURITY DEFINER so it
-- bypasses RLS and continues to work for INSERT checks on resources_links.
