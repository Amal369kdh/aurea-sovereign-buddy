
-- ============================================================
-- NETTOYAGE DES TRIGGERS DUPLIQUÉS
-- Des anciennes et nouvelles versions coexistent, ce qui peut
-- provoquer des doubles exécutions (double points, double match, etc.)
-- On garde les versions "trg_*" (nos nouvelles) et supprime les anciennes.
-- ============================================================

-- ── dating_likes : double match ──────────────────────────────
DROP TRIGGER IF EXISTS check_mutual_like_trigger ON public.dating_likes;

-- ── announcements : double attribution de points ─────────────
DROP TRIGGER IF EXISTS award_points_on_announcement ON public.announcements;

-- ── comments : double mise à jour du compteur ────────────────
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;

-- ── solution_messages : double incrément compteur ────────────
DROP TRIGGER IF EXISTS on_solution_message ON public.solution_messages;
DROP TRIGGER IF EXISTS on_solution_message_insert ON public.solution_messages;

-- ── profiles : double updated_at ─────────────────────────────
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- ── dating_profiles : double updated_at ──────────────────────
DROP TRIGGER IF EXISTS update_dating_profiles_updated_at ON public.dating_profiles;

-- ── user_tasks : double updated_at ───────────────────────────
DROP TRIGGER IF EXISTS update_user_tasks_updated_at ON public.user_tasks;

-- ── user_documents : double updated_at ───────────────────────
DROP TRIGGER IF EXISTS update_user_documents_updated_at ON public.user_documents;

-- ── student_email_verifications : triple rate-limit ──────────
DROP TRIGGER IF EXISTS before_insert_rate_limit ON public.student_email_verifications;
DROP TRIGGER IF EXISTS trg_verification_rate_limit ON public.student_email_verifications;
-- On garde uniquement trg_check_verification_rate_limit
