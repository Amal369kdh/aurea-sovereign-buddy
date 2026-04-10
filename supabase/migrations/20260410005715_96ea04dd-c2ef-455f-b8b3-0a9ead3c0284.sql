
-- Create function to auto-update likes_count via trigger (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.update_announcement_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.announcements
    SET likes_count = likes_count + 1
    WHERE id = NEW.announcement_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.announcements
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.announcement_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on announcement_likes
CREATE TRIGGER update_likes_count_on_like
AFTER INSERT OR DELETE ON public.announcement_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_announcement_likes_count();
