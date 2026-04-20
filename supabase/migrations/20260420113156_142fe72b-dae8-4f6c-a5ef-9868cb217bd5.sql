CREATE OR REPLACE FUNCTION public.get_admin_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _total_users int;
  _new_week int;
  _active_week int;
  _premium_count int;
  _verified_count int;
  _pending_feedbacks int;
  _critical_alerts int;
  _pending_reports int;
  _top_cities jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO _total_users FROM profiles;

  SELECT COUNT(*) INTO _new_week
  FROM profiles
  WHERE created_at >= now() - interval '7 days';

  -- Actif = a posté/commenté/liké dans les 7 derniers jours
  SELECT COUNT(DISTINCT uid) INTO _active_week FROM (
    SELECT author_id AS uid FROM announcements WHERE created_at >= now() - interval '7 days'
    UNION
    SELECT author_id FROM comments WHERE created_at >= now() - interval '7 days'
    UNION
    SELECT user_id FROM announcement_likes WHERE created_at >= now() - interval '7 days'
  ) sub;

  SELECT COUNT(*) INTO _premium_count FROM profiles WHERE is_premium = true;
  SELECT COUNT(*) INTO _verified_count FROM profiles WHERE is_verified = true;

  SELECT COUNT(*) INTO _pending_feedbacks FROM feedbacks WHERE status = 'nouveau';

  SELECT COUNT(*) INTO _critical_alerts
  FROM admin_alerts
  WHERE is_resolved = false AND severity = 'critical';

  SELECT COUNT(*) INTO _pending_reports FROM reports WHERE status = 'pending';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('city', city, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
  INTO _top_cities
  FROM (
    SELECT city, COUNT(*) AS cnt
    FROM profiles
    WHERE city IS NOT NULL
    GROUP BY city
    ORDER BY cnt DESC
    LIMIT 3
  ) t;

  _result := jsonb_build_object(
    'users', jsonb_build_object(
      'total', _total_users,
      'new_this_week', _new_week,
      'active_this_week', _active_week
    ),
    'conversion', jsonb_build_object(
      'premium_count', _premium_count,
      'premium_rate', CASE WHEN _total_users > 0 THEN ROUND((_premium_count::numeric / _total_users) * 100, 2) ELSE 0 END
    ),
    'verification', jsonb_build_object(
      'verified_count', _verified_count,
      'verified_rate', CASE WHEN _total_users > 0 THEN ROUND((_verified_count::numeric / _total_users) * 100, 2) ELSE 0 END
    ),
    'feedbacks', jsonb_build_object('pending', _pending_feedbacks),
    'alerts', jsonb_build_object('critical_active', _critical_alerts),
    'moderation', jsonb_build_object('pending_reports', _pending_reports),
    'top_cities', _top_cities,
    'generated_at', now()
  );

  RETURN _result;
END;
$$;