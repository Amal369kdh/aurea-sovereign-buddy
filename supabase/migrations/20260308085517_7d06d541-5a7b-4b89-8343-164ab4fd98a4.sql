
-- Feature flags table (toggles for V2/V3 features)
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'admin'
  ));

INSERT INTO public.feature_flags (key, label, description, enabled) VALUES
  ('hub_social', 'Hub Social', 'Onglet Hub Social — annonces, entraide, feed communautaire', true),
  ('rencontres', 'Rencontres', 'Mode rencontre — profils dating, matching, messagerie', false),
  ('comparateurs', 'Comparateurs', 'Outils comparateurs banques, assurances, logements', false),
  ('amal_avancee', 'Amal Avancée', 'Fonctionnalités IA avancées d''Amal (analyses, plans personnalisés)', false);

-- Partners table
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'bank',
  offer text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active partners"
  ON public.partners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage partners"
  ON public.partners FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'admin'
  ));

-- Allowed domains for Témoin verification
CREATE TABLE public.allowed_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL UNIQUE,
  university_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read allowed domains"
  ON public.allowed_domains FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage allowed domains"
  ON public.allowed_domains FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND status = 'admin'
  ));

INSERT INTO public.allowed_domains (domain, university_name) VALUES
  ('etu.univ-grenoble-alpes.fr', 'Université Grenoble Alpes'),
  ('etud.grenoble-inp.fr', 'Grenoble INP'),
  ('ens.fr', 'ENS Paris'),
  ('student.42.fr', 'École 42');
