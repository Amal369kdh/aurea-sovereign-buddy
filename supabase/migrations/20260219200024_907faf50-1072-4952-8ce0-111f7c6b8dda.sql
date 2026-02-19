
-- Add new profile fields for consumption, admin dates, and social preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_status text DEFAULT 'futur_arrivant' CHECK (student_status IN ('futur_arrivant', 'en_france', 'francais')),
  ADD COLUMN IF NOT EXISTS dietary text DEFAULT 'classique',
  ADD COLUMN IF NOT EXISTS cuisine_preferences text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_groceries_weekly integer,
  ADD COLUMN IF NOT EXISTS nearby_stores text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expertise_domains text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS titre_sejour_expiry text,
  ADD COLUMN IF NOT EXISTS apl_status text DEFAULT 'a_faire' CHECK (apl_status IN ('faite', 'a_faire', 'besoin_aide')),
  ADD COLUMN IF NOT EXISTS next_deadline_label text,
  ADD COLUMN IF NOT EXISTS next_deadline_date date,
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1;
