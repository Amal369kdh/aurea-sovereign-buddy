-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON public.profiles;

-- Chaque utilisateur ne peut lire que son propre profil complet
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Vue publique limitée pour le social et le dating
CREATE OR REPLACE VIEW public.profiles_public AS
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

-- Accès à la vue publique pour tous les authentifiés
GRANT SELECT ON public.profiles_public TO authenticated;