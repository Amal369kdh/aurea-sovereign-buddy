
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule nightly reset of aya_messages_used at midnight for non-premium users
SELECT cron.schedule(
  'reset-aya-messages-nightly',
  '0 0 * * *',
  $$
  UPDATE public.profiles
  SET aya_messages_used = 0
  WHERE is_premium = false;
  $$
);
