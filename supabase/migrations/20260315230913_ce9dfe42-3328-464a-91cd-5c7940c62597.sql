-- CORRECTION 2 : Activer security_invoker sur la vue existante
-- sans changer l'ordre des colonnes
ALTER VIEW public.profiles_public SET (security_invoker = on);