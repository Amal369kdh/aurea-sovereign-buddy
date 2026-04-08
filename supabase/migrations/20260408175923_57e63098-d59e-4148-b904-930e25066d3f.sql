
-- Function to check report threshold and auto-hide announcement
CREATE OR REPLACE FUNCTION public.check_community_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _report_count integer;
  _author_id uuid;
BEGIN
  -- Only process reports on announcements
  IF NEW.reported_announcement_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count total reports for this announcement
  SELECT COUNT(*) INTO _report_count
  FROM public.reports
  WHERE reported_announcement_id = NEW.reported_announcement_id
    AND status = 'pending';

  -- If 5+ reports, auto-hide the announcement
  IF _report_count >= 5 THEN
    -- Get author before deletion
    SELECT author_id INTO _author_id
    FROM public.announcements
    WHERE id = NEW.reported_announcement_id;

    -- Delete the announcement
    DELETE FROM public.announcements
    WHERE id = NEW.reported_announcement_id;

    -- Notify the author
    IF _author_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        _author_id,
        'community_alert',
        'Post retiré par la communauté 🛡️',
        'Ton post a été signalé par plusieurs membres et a été retiré automatiquement.',
        jsonb_build_object('announcement_id', NEW.reported_announcement_id)
      );
    END IF;

    -- Mark all reports as resolved
    UPDATE public.reports
    SET status = 'resolved'
    WHERE reported_announcement_id = NEW.reported_announcement_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_report_check_community_alert
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_community_alert();
