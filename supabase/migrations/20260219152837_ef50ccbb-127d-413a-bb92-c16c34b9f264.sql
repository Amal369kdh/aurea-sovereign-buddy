
-- Table des matchs mutuels
CREATE TABLE public.dating_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID NOT NULL,
  user_b UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT dating_matches_unique UNIQUE (user_a, user_b)
);

ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

-- Les deux participants peuvent voir leur match
CREATE POLICY "Users can read own matches"
  ON public.dating_matches FOR SELECT
  USING ((user_a = auth.uid()) OR (user_b = auth.uid()));

-- Seul le système insère (via trigger)
CREATE POLICY "System inserts matches"
  ON public.dating_matches FOR INSERT
  WITH CHECK ((user_a = auth.uid()) OR (user_b = auth.uid()));

CREATE POLICY "Users can delete own matches"
  ON public.dating_matches FOR DELETE
  USING ((user_a = auth.uid()) OR (user_b = auth.uid()));

-- Table des messages de dating (chat entre matchs)
CREATE TABLE public.dating_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.dating_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dating_messages ENABLE ROW LEVEL SECURITY;

-- Participants du match peuvent lire les messages
CREATE POLICY "Match participants can read messages"
  ON public.dating_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dating_matches m
    WHERE m.id = dating_messages.match_id
    AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  ));

-- Participants du match peuvent envoyer (Gold only côté frontend)
CREATE POLICY "Match participants can send messages"
  ON public.dating_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.dating_matches m
      WHERE m.id = dating_messages.match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
    )
  );

-- Fonction trigger : créer un match quand un like mutuel est détecté
CREATE OR REPLACE FUNCTION public.check_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_a UUID;
  _user_b UUID;
BEGIN
  -- Vérifier si l'autre personne a aussi liké
  IF EXISTS (
    SELECT 1 FROM public.dating_likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    -- Ordonner les IDs pour éviter les doublons
    IF NEW.liker_id < NEW.liked_id THEN
      _user_a := NEW.liker_id;
      _user_b := NEW.liked_id;
    ELSE
      _user_a := NEW.liked_id;
      _user_b := NEW.liker_id;
    END IF;

    -- Insérer le match s'il n'existe pas
    INSERT INTO public.dating_matches (user_a, user_b)
    VALUES (_user_a, _user_b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_mutual_like
  AFTER INSERT ON public.dating_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_mutual_like();

-- Realtime pour les matchs et messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.dating_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dating_messages;
