
-- 1. Table feedbacks
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'idee', 'plainte')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 1000),
  status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'lu', 'traite')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedbacks"
ON public.feedbacks FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create own feedbacks"
ON public.feedbacks FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update feedbacks"
ON public.feedbacks FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete feedbacks"
ON public.feedbacks FOR DELETE
USING (is_admin(auth.uid()));

CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_feedbacks_status ON public.feedbacks(status, created_at DESC);
CREATE INDEX idx_feedbacks_user ON public.feedbacks(user_id);

-- 2. Table admin_alerts
CREATE TABLE public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  metadata JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alerts"
ON public.admin_alerts FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update alerts"
ON public.admin_alerts FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Service can insert alerts"
ON public.admin_alerts FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_admin_alerts_created ON public.admin_alerts(is_resolved, created_at DESC);

-- 3. Trigger : alerte si 3+ signalements sur le même contenu
CREATE OR REPLACE FUNCTION public.alert_on_multiple_reports()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
  _target_id UUID;
  _existing_alert UUID;
BEGIN
  _target_id := COALESCE(NEW.reported_announcement_id, NEW.reported_user_id);
  IF _target_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO _count
  FROM public.reports
  WHERE (reported_announcement_id = NEW.reported_announcement_id 
         OR reported_user_id = NEW.reported_user_id)
    AND status = 'pending';

  IF _count >= 3 THEN
    SELECT id INTO _existing_alert
    FROM public.admin_alerts
    WHERE alert_type = 'multiple_reports'
      AND related_id = _target_id
      AND is_resolved = false
    LIMIT 1;

    IF _existing_alert IS NULL THEN
      INSERT INTO public.admin_alerts (alert_type, severity, title, description, related_id, metadata)
      VALUES (
        'multiple_reports',
        'critical',
        'Contenu signalé ' || _count || ' fois 🚨',
        CASE 
          WHEN NEW.reported_announcement_id IS NOT NULL 
          THEN 'Une publication a reçu ' || _count || ' signalements actifs.'
          ELSE 'Un utilisateur a reçu ' || _count || ' signalements actifs.'
        END,
        _target_id,
        jsonb_build_object('report_count', _count, 'is_announcement', NEW.reported_announcement_id IS NOT NULL)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_alert_on_multiple_reports
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.alert_on_multiple_reports();

-- 4. Fonction : détecter pic d'inscriptions (à appeler via cron ou manuellement)
CREATE OR REPLACE FUNCTION public.check_signup_spike()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today_count INTEGER;
  _avg_count NUMERIC;
BEGIN
  SELECT COUNT(*) INTO _today_count
  FROM public.profiles
  WHERE created_at >= date_trunc('day', now());

  SELECT COALESCE(AVG(daily_count), 0) INTO _avg_count
  FROM (
    SELECT COUNT(*) AS daily_count
    FROM public.profiles
    WHERE created_at >= now() - interval '7 days'
      AND created_at < date_trunc('day', now())
    GROUP BY date_trunc('day', created_at)
  ) sub;

  IF _avg_count > 0 AND _today_count >= (_avg_count * 3) AND _today_count >= 10 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_alerts
      WHERE alert_type = 'signup_spike'
        AND created_at >= date_trunc('day', now())
    ) THEN
      INSERT INTO public.admin_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'signup_spike',
        'warning',
        'Pic d''inscriptions détecté 📈',
        _today_count || ' inscriptions aujourd''hui (moyenne 7j : ' || ROUND(_avg_count, 1) || '). Vérifie qu''il ne s''agit pas de bots.',
        jsonb_build_object('today', _today_count, 'avg_7d', _avg_count)
      );
    END IF;
  END IF;
END;
$$;
