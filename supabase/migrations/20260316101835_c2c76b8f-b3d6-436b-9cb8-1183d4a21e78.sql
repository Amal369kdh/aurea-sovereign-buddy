-- Recreate missing triggers for student email verifications
-- Add the temporary 'token' column so the trigger can hash it
ALTER TABLE public.student_email_verifications 
ADD COLUMN IF NOT EXISTS token TEXT;

-- Recreate the hash verification token trigger function
CREATE OR REPLACE FUNCTION public.hash_verification_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.token_hash := encode(digest(NEW.token, 'sha256'), 'hex');
  NEW.token := '***';
  RETURN NEW;
END;
$function$;

-- Recreate the rate limit trigger function
CREATE OR REPLACE FUNCTION public.check_verification_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.student_email_verifications
    WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'Trop de demandes. Réessaie dans une heure.';
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS before_insert_rate_limit ON public.student_email_verifications;
DROP TRIGGER IF EXISTS before_insert_hash_token ON public.student_email_verifications;

CREATE TRIGGER before_insert_rate_limit
  BEFORE INSERT ON public.student_email_verifications
  FOR EACH ROW EXECUTE FUNCTION public.check_verification_rate_limit();

CREATE TRIGGER before_insert_hash_token
  BEFORE INSERT ON public.student_email_verifications
  FOR EACH ROW EXECUTE FUNCTION public.hash_verification_token();

-- Recreate other missing triggers
DROP TRIGGER IF EXISTS award_points_on_announcement ON public.announcements;
CREATE TRIGGER award_points_on_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.award_entraide_points();

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

DROP TRIGGER IF EXISTS check_mutual_like_trigger ON public.dating_likes;
CREATE TRIGGER check_mutual_like_trigger
  AFTER INSERT ON public.dating_likes
  FOR EACH ROW EXECUTE FUNCTION public.check_mutual_like();

DROP TRIGGER IF EXISTS on_solution_message ON public.solution_messages;
CREATE TRIGGER on_solution_message
  AFTER INSERT ON public.solution_messages
  FOR EACH ROW EXECUTE FUNCTION public.increment_solution_msg_count();