
-- CORRECTIF #4 : Les compteurs de messages dans solution_conversations
-- sont gérés UNIQUEMENT par le trigger SECURITY DEFINER increment_solution_msg_count.
-- Aucun client ne doit pouvoir modifier cette table directement.
DROP POLICY IF EXISTS "Participants can update msg counts" ON public.solution_conversations;

-- Note : pas de nouvelle politique UPDATE — les mises à jour passent
-- exclusivement par le trigger increment_solution_msg_count (SECURITY DEFINER).
