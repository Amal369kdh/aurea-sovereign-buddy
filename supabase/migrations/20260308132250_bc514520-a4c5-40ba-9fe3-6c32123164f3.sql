-- Fix the same recursion issue in reports table
DROP POLICY IF EXISTS "Admins can read all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Admins can read all reports"
ON public.reports
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
USING (is_admin(auth.uid()));

-- Fix the same issue in allowed_domains
DROP POLICY IF EXISTS "Admins can manage allowed domains" ON public.allowed_domains;

CREATE POLICY "Admins can manage allowed domains"
ON public.allowed_domains
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix the same issue in feature_flags
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;

CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix the same issue in partners
DROP POLICY IF EXISTS "Admins can manage partners" ON public.partners;

CREATE POLICY "Admins can manage partners"
ON public.partners
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix announcements admin policies
DROP POLICY IF EXISTS "Admins can delete any announcement" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert pinned announcements" ON public.announcements;

CREATE POLICY "Admins can delete any announcement"
ON public.announcements
FOR DELETE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert pinned announcements"
ON public.announcements
FOR INSERT
WITH CHECK (is_admin(auth.uid()));