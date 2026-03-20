
-- 1. Add url column to partners table
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS url text;

-- 2. Create partner_link_clicks table
CREATE TABLE IF NOT EXISTS public.partner_link_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  clicked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_link_clicks ENABLE ROW LEVEL SECURITY;

-- Admins can read all clicks
CREATE POLICY "Admins can read partner clicks"
  ON public.partner_link_clicks
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Authenticated users can insert their own clicks
CREATE POLICY "Users can insert own clicks"
  ON public.partner_link_clicks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Index for fast aggregation per partner
CREATE INDEX IF NOT EXISTS idx_partner_link_clicks_partner_id ON public.partner_link_clicks(partner_id);
