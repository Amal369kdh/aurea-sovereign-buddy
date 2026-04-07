
-- Reference table for badge definitions
CREATE TABLE public.badges (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'star',
  category text NOT NULL DEFAULT 'general',
  threshold integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges" ON public.badges
  FOR SELECT TO authenticated USING (true);

-- User badges (earned)
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System inserts badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO public.badges (id, label, description, icon, category, threshold) VALUES
  ('first_post', 'Premier Post', 'Publie ton premier post sur le Hub Entraide', 'message-circle', 'social', 1),
  ('helper_5', 'Entraideur', 'Publie 5 posts d''entraide', 'heart-handshake', 'social', 5),
  ('helper_20', 'Expert Entraide', 'Publie 20 posts d''entraide', 'award', 'social', 20),
  ('liked_10', 'Apprécié', 'Reçois 10 likes sur tes posts', 'thumbs-up', 'social', 10),
  ('dossier_25', 'En Route', 'Atteins 25% de progression dans Mon Dossier', 'rocket', 'integration', 25),
  ('dossier_50', 'Mi-Chemin', 'Atteins 50% de progression dans Mon Dossier', 'target', 'integration', 50),
  ('dossier_100', 'Souverain', 'Complète 100% de ton dossier d''intégration', 'crown', 'integration', 100),
  ('verified', 'Vérifié', 'Fais vérifier ton email étudiant', 'shield-check', 'account', 1),
  ('social_50', 'Social Star', 'Accumule 50 points sociaux', 'star', 'social', 50),
  ('week_streak', 'Régulier', 'Connecte-toi 7 jours de suite', 'flame', 'engagement', 7);
