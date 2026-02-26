DROP POLICY IF EXISTS "System inserts matches" ON public.dating_matches;
CREATE POLICY "System inserts matches"
ON public.dating_matches FOR INSERT
WITH CHECK (false);