-- Recréer la vue avec security_invoker pour respecter les RLS du requêteur
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  user_id,
  display_name,
  avatar_initials,
  university,
  city,
  status,
  points_social,
  is_verified,
  interests
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;