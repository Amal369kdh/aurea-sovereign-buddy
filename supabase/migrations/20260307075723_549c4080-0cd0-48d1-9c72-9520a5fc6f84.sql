
-- ============================================================
-- 4. Anti-spam on points sociaux (max 20 pts awarded per day per user)
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_entraide_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pts_today integer;
BEGIN
  IF NEW.category = 'entraide' THEN
    -- Count points already awarded today
    SELECT COALESCE(SUM(5), 0) INTO _pts_today
    FROM public.announcements
    WHERE author_id = NEW.author_id
      AND category = 'entraide'
      AND created_at >= date_trunc('day', now());

    -- Daily cap: 20 pts (= 4 entraide posts per day)
    IF _pts_today < 20 THEN
      UPDATE public.profiles
      SET points_social = points_social + 5
      WHERE user_id = NEW.author_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
