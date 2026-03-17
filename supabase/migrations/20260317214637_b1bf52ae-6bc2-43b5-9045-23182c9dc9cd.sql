-- ============================================================
-- CORRECTIF 6 : Recréer tous les triggers manquants
-- ============================================================
-- La section db-triggers était vide malgré toutes les fonctions définies.
-- Chaque trigger est créé avec OR REPLACE (idempotent) pour éviter
-- les erreurs si certains existent partiellement.
-- ============================================================

-- 1. handle_new_user : crée automatiquement un profil à l'inscription
--    AFTER INSERT sur auth.users — trigger Supabase standard
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. check_verification_rate_limit : limite à 3 demandes/heure
--    BEFORE INSERT sur student_email_verifications
--    Sécurité : empêche le spam de tokens de vérification
CREATE OR REPLACE TRIGGER trg_check_verification_rate_limit
  BEFORE INSERT ON public.student_email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_verification_rate_limit();

-- 3. check_mutual_like : crée un match dating si like mutuel
--    AFTER INSERT sur dating_likes
--    CRITIQUE : sans ce trigger, la feature dating ne fonctionne pas
CREATE OR REPLACE TRIGGER trg_check_mutual_like
  AFTER INSERT ON public.dating_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_like();

-- 4. increment_solution_msg_count : incrémente le compteur de messages
--    AFTER INSERT sur solution_messages
--    SÉCURITÉ : sans ce trigger, le RLS laisse passer tous les messages
--    (compteur reste à 0, toujours < 3)
CREATE OR REPLACE TRIGGER trg_increment_solution_msg_count
  AFTER INSERT ON public.solution_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_solution_msg_count();

-- 5. update_comments_count : maintient le compteur de commentaires
--    AFTER INSERT/DELETE sur comments
CREATE OR REPLACE TRIGGER trg_update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_count();

-- 6. award_entraide_points : attribue des points sociaux
--    AFTER INSERT sur announcements (catégorie entraide uniquement)
CREATE OR REPLACE TRIGGER trg_award_entraide_points
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.award_entraide_points();

-- 7. update_updated_at sur profiles
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. update_updated_at sur dating_profiles
CREATE OR REPLACE TRIGGER trg_dating_profiles_updated_at
  BEFORE UPDATE ON public.dating_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. update_updated_at sur user_documents
CREATE OR REPLACE TRIGGER trg_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. update_updated_at sur user_tasks
CREATE OR REPLACE TRIGGER trg_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();