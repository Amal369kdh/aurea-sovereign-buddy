CREATE OR REPLACE FUNCTION public.check_verification_rate_limit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_verification_rate_limit
BEFORE INSERT ON public.student_email_verifications
FOR EACH ROW EXECUTE FUNCTION public.check_verification_rate_limit();