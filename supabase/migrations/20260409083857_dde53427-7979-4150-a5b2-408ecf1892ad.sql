
-- Table for mentor offers from verified "témoin" users
CREATE TABLE public.mentor_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_offers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active offers
CREATE POLICY "Authenticated can read active mentor offers"
ON public.mentor_offers
FOR SELECT
TO authenticated
USING (is_active = true OR mentor_id = auth.uid());

-- Only témoins can create offers
CREATE POLICY "Témoins can create mentor offers"
ON public.mentor_offers
FOR INSERT
TO authenticated
WITH CHECK (mentor_id = auth.uid() AND is_temoin(auth.uid()));

-- Only own offers can be updated
CREATE POLICY "Mentors can update own offers"
ON public.mentor_offers
FOR UPDATE
TO authenticated
USING (mentor_id = auth.uid())
WITH CHECK (mentor_id = auth.uid());

-- Only own offers can be deleted
CREATE POLICY "Mentors can delete own offers"
ON public.mentor_offers
FOR DELETE
TO authenticated
USING (mentor_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_mentor_offers_updated_at
BEFORE UPDATE ON public.mentor_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
