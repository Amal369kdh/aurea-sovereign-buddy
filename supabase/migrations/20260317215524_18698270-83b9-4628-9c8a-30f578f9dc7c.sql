
-- ============================================================
-- CORRECTIFS SÉCURITÉ CRITIQUES — AUDIT FINAL
-- ============================================================

-- ── FAILLE 1 : Escalade de privilèges via INSERT sur profiles ──
-- Un utilisateur pouvait s'insérer avec status='admin',
-- is_verified=true ou is_premium=true, contournant toutes les RLS.
-- → Remplacer par une politique WITH CHECK stricte.

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'explorateur'
    AND is_verified = false
    AND is_premium = false
  );

-- ── FAILLE 2 : Exposition massive de données sensibles via SELECT ──
-- "Authenticated can read public profile fields" avait USING: true
-- → tous les champs (birth_date, budget, revenus, visa_type, etc.)
-- visibles par n'importe quel utilisateur connecté.
-- → Supprimer. L'accès croisé doit passer par profiles_public.
-- L'accès à son propre profil complet reste via "Users can read own profile".

DROP POLICY IF EXISTS "Authenticated can read public profile fields" ON public.profiles;

-- ============================================================
-- Résultat final des accès SELECT sur profiles :
-- • Utilisateur → son propre profil complet (user_id = auth.uid())
-- • Admin       → tous les profils complets  (is_admin())
-- • Cross-user  → seulement via la vue profiles_public (champs safe)
-- ============================================================
