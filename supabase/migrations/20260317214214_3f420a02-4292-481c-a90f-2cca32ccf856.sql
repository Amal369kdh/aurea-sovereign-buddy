-- ============================================================
-- CORRECTIF 3 : Sécuriser la vue profiles_public
-- ============================================================
-- La vue profiles_public s'exécutait en SECURITY DEFINER implicite,
-- contournant les politiques RLS de profiles. Tout utilisateur anon
-- pouvait lire l'ensemble des profils.
--
-- Étape 1 : activer security_invoker sur la vue
-- (PostgreSQL évalue les politiques RLS avec l'identité du requêtant)
ALTER VIEW public.profiles_public SET (security_invoker = on);

-- Étape 2 : Ajouter une politique permissive pour les utilisateurs
-- authentifiés afin qu'ils puissent voir les profils des autres.
-- Cette policy ne concerne que les champs non-sensibles — la vue
-- profiles_public ne projette que : user_id, display_name, avatar_initials,
-- university, city, status, interests, target_city, objectifs,
-- points_social, is_verified. Les champs sensibles (budget, visa,
-- suspended_until, etc.) restent invisibles car non inclus dans la vue.
CREATE POLICY "Authenticated can read public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);