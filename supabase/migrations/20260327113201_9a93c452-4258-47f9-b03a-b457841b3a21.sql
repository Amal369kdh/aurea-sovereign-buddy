
-- Table pour stocker les souscriptions push par appareil
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push subscriptions"
ON public.push_subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
ON public.push_subscriptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Service role needs access to send push notifications
CREATE POLICY "Service role can read all subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.role() = 'service_role');
