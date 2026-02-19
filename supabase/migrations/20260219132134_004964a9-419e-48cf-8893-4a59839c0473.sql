
-- Add Aya message counter to profiles
ALTER TABLE public.profiles ADD COLUMN aya_messages_used integer NOT NULL DEFAULT 0;
