ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS logement_situation text,
ADD COLUMN IF NOT EXISTS mutuelle boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mutuelle_nom text,
ADD COLUMN IF NOT EXISTS visa_type text;