
DROP POLICY IF EXISTS "Service can insert alerts" ON public.admin_alerts;

CREATE POLICY "Only service role can insert alerts"
ON public.admin_alerts FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR is_admin(auth.uid()));
