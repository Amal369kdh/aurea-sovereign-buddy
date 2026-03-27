
-- Update trigger function to use direct URL (project ref is known)
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ddbfmgqknjggkokyfmzz.supabase.co/functions/v1/send-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'data', jsonb_build_object('type', NEW.type)
    )
  );
  RETURN NEW;
END;
$$;
