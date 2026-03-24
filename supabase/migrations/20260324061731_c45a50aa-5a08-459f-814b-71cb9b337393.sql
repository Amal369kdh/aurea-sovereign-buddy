ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS display_author_name TEXT DEFAULT NULL;