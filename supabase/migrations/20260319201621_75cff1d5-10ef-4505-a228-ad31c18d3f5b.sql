-- Restreindre la lecture des likes aux utilisateurs authentifiés seulement
DROP POLICY IF EXISTS "Users can read likes" ON public.announcement_likes;
CREATE POLICY "Authenticated can read likes"
ON public.announcement_likes FOR SELECT
TO authenticated
USING (true);