
-- CORRECTIF #3 : Empêcher le requester d'accepter sa propre demande
-- Seul le target_id peut changer le status vers accepted/rejected.
DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;

CREATE POLICY "Users can update own connections"
ON public.connections
FOR UPDATE
TO authenticated
USING (
  -- Seul le target peut modifier le statut (accepter / rejeter)
  target_id = auth.uid()
)
WITH CHECK (
  target_id = auth.uid()
  -- Le requester ne peut jamais se retrouver comme target après update
  AND requester_id <> auth.uid()
);
