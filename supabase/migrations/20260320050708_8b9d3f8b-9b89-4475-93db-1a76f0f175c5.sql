
-- ============================================================
-- 1. Fix: comments readable by unauthenticated users
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can read comments" ON public.comments;
CREATE POLICY "Anyone authenticated can read comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 2. Fix: resources_links readable by unauthenticated users
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can read resources" ON public.resources_links;
CREATE POLICY "Anyone authenticated can read resources"
  ON public.resources_links FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 3. Fix: feature_flags readable by unauthenticated users
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can read feature flags" ON public.feature_flags;
CREATE POLICY "Anyone authenticated can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 4. Fix: allowed_domains readable by unauthenticated users
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read allowed domains" ON public.allowed_domains;
CREATE POLICY "Authenticated can read allowed domains"
  ON public.allowed_domains FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 5. Fix: Announcements INSERT — restrict to temoin/admin only
-- ============================================================
DROP POLICY IF EXISTS "Users can create announcements" ON public.announcements;
CREATE POLICY "Verified users can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (is_temoin(auth.uid()) OR is_admin(auth.uid()))
  );

-- ============================================================
-- 6. Enable pg_cron for daily aya reset
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ============================================================
-- 7. Daily reset of aya_messages_used at midnight UTC
-- ============================================================
SELECT cron.schedule(
  'reset-aya-messages-daily',
  '0 0 * * *',
  $$UPDATE public.profiles SET aya_messages_used = 0 WHERE is_premium = false$$
);

-- ============================================================
-- 8. Notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read, created_at DESC);

-- ============================================================
-- 9. Trigger: notify on new private message
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_name text;
BEGIN
  SELECT display_name INTO _sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.receiver_id,
    'new_message',
    'Nouveau message 💬',
    COALESCE(_sender_name, 'Un utilisateur') || ' t''a envoyé un message',
    jsonb_build_object('sender_id', NEW.sender_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

-- ============================================================
-- 10. Trigger: notify on new dating match
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_new_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (NEW.user_a, 'new_match', 'Nouveau match 💛', 'Vous avez un nouveau match !', jsonb_build_object('match_id', NEW.id));
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (NEW.user_b, 'new_match', 'Nouveau match 💛', 'Vous avez un nouveau match !', jsonb_build_object('match_id', NEW.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_match ON public.dating_matches;
CREATE TRIGGER trg_notify_new_match
  AFTER INSERT ON public.dating_matches
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_match();

-- ============================================================
-- 11. Trigger: notify on new comment on own announcement
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _post_author uuid;
  _commenter_name text;
BEGIN
  SELECT author_id INTO _post_author FROM public.announcements WHERE id = NEW.announcement_id;
  IF _post_author = NEW.author_id THEN RETURN NEW; END IF;
  SELECT display_name INTO _commenter_name FROM public.profiles WHERE user_id = NEW.author_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    _post_author,
    'new_comment',
    'Nouveau commentaire 💬',
    COALESCE(_commenter_name, 'Quelqu''un') || ' a répondu à ton post',
    jsonb_build_object('announcement_id', NEW.announcement_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_comment ON public.comments;
CREATE TRIGGER trg_notify_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_comment();
