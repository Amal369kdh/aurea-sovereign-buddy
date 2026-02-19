
-- 1. Function to clean up expired announcements (older than 2 weeks, not pinned)
CREATE OR REPLACE FUNCTION public.cleanup_expired_announcements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.announcements
  WHERE is_pinned = false
    AND (
      (expires_at IS NOT NULL AND expires_at < now())
      OR (expires_at IS NULL AND created_at < now() - interval '14 days')
    );
END;
$$;

-- 2. Trigger to award points_social when posting in 'entraide' category
CREATE OR REPLACE FUNCTION public.award_entraide_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.category = 'entraide' THEN
    UPDATE public.profiles
    SET points_social = points_social + 5
    WHERE user_id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_entraide_points
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.award_entraide_points();
