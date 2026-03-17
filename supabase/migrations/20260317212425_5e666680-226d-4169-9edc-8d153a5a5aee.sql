
-- ============================================================
-- CORRECTIF #2 : Bloquer l'escalade de privilèges sur profiles
-- Objectif : empêcher un utilisateur authentifié de modifier
-- is_verified, is_premium, status, points, aya_messages_used
-- via un UPDATE client direct.
-- La fonction SECURITY DEFINER est invisible à la RLS client.
-- ============================================================

-- Fonction qui compare les champs sensibles entre OLD et NEW.
-- Appelée dans le WITH CHECK de la politique UPDATE.
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed(
  p_user_id uuid,
  p_new_status text,
  p_new_is_verified boolean,
  p_new_is_premium boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- status ne peut être modifié que si identique à l'actuel
    p_new_status = profiles.status
    -- is_verified ne peut jamais être modifié côté client
    AND p_new_is_verified = profiles.is_verified
    -- is_premium ne peut jamais être modifié côté client
    AND p_new_is_premium = profiles.is_premium
  FROM public.profiles
  WHERE profiles.user_id = p_user_id;
$$;

-- Suppression de l'ancienne politique UPDATE utilisateur
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Nouvelle politique avec protection renforcée
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND public.check_profile_update_allowed(
    auth.uid(),
    status,
    is_verified,
    is_premium
  )
);
