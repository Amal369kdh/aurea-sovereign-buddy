
-- Enrich profiles table with new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS target_city text,
ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_swipes_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_swipe_reset timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'explorateur'
  CHECK (status IN ('explorateur', 'temoin')),
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS budget_monthly integer,
ADD COLUMN IF NOT EXISTS revenus_monthly integer,
ADD COLUMN IF NOT EXISTS objectifs text[];

-- Add comments column to announcements for comment count
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;

-- Create universities reference table
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  city text NOT NULL DEFAULT 'Grenoble',
  short_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read universities"
ON public.universities FOR SELECT
USING (true);

-- Seed some universities
INSERT INTO public.universities (name, short_name, city) VALUES
  ('Université Grenoble Alpes', 'UGA', 'Grenoble'),
  ('Grenoble INP', 'INP', 'Grenoble'),
  ('INSA Lyon', 'INSA', 'Lyon'),
  ('Sciences Po Grenoble', 'ScPo', 'Grenoble'),
  ('Grenoble Ecole de Management', 'GEM', 'Grenoble'),
  ('Université Jean Moulin', 'UJM', 'Lyon')
ON CONFLICT (name) DO NOTHING;

-- Add university_id FK to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES public.universities(id);

-- Create announcement_likes table for proper like tracking
CREATE TABLE IF NOT EXISTS public.announcement_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read likes"
ON public.announcement_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like"
ON public.announcement_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike"
ON public.announcement_likes FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for announcement_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_likes;
