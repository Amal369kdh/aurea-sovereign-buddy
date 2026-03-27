
-- Function that calls the send-push edge function when a notification is inserted
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the send-push edge function via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
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

-- Trigger on notification insert
CREATE TRIGGER on_notification_send_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_push_notification();
