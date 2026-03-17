
-- ================================================================
-- MIGRATION: Restreindre commentaires et likes aux Témoins/Admins
-- Logique : seuls les utilisateurs vérifiés peuvent interagir.
-- ================================================================

-- 1. Supprimer l'ancienne politique INSERT ouverte sur comments
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;

-- 2. Nouvelle politique : uniquement les utilisateurs vérifiés
CREATE POLICY "Verified users can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (is_temoin(auth.uid()) OR is_admin(auth.uid()))
  );

-- 3. Supprimer l'ancienne politique INSERT ouverte sur announcement_likes
DROP POLICY IF EXISTS "Users can like" ON public.announcement_likes;

-- 4. Nouvelle politique : uniquement les utilisateurs vérifiés
CREATE POLICY "Verified users can like"
  ON public.announcement_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (is_temoin(auth.uid()) OR is_admin(auth.uid()))
  );

-- 5. Supprimer l'ancienne politique DELETE ouverte sur announcement_likes
DROP POLICY IF EXISTS "Users can unlike" ON public.announcement_likes;

-- 6. Nouvelle politique unlike : uniquement le propriétaire vérifié
CREATE POLICY "Verified users can unlike"
  ON public.announcement_likes
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (is_temoin(auth.uid()) OR is_admin(auth.uid()))
  );
