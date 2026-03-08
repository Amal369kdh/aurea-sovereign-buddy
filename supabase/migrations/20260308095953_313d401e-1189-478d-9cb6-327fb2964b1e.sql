
-- Drop existing status check constraint and recreate with admin/gold/temoin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status = ANY (ARRAY['explorateur'::text, 'temoin'::text, 'admin'::text, 'gold'::text]));
