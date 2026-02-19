
-- Add is_in_france column to profiles (null = not yet answered, true = already in France, false = not yet)
ALTER TABLE public.profiles 
ADD COLUMN is_in_france boolean DEFAULT NULL;

-- Add arrival_date for students not yet in France (optional, for future use)
ALTER TABLE public.profiles 
ADD COLUMN arrival_date date DEFAULT NULL;
