
-- Table to persist AI-generated city resources so Perplexity is only called once
CREATE TABLE public.city_resources_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  last_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

ALTER TABLE public.city_resources_cache ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read cached resources
CREATE POLICY "Authenticated can read city resources"
  ON public.city_resources_cache FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage city resources"
  ON public.city_resources_cache FOR ALL
  TO public
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
