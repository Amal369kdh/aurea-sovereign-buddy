
-- Dating profiles (separate from main profile)
CREATE TABLE public.dating_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  looking_for text NOT NULL DEFAULT 'amitie', -- amitie, relation, les_deux
  age_min integer DEFAULT 18,
  age_max integer DEFAULT 30,
  show_me text NOT NULL DEFAULT 'tous', -- hommes, femmes, tous
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read active dating profiles"
  ON public.dating_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create own dating profile"
  ON public.dating_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dating profile"
  ON public.dating_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own dating profile"
  ON public.dating_profiles FOR DELETE
  USING (user_id = auth.uid());

-- Security definer: check if user has a dating profile
CREATE OR REPLACE FUNCTION public.has_dating_profile(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dating_profiles
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Dating likes
CREATE TABLE public.dating_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL,
  liked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id),
  CHECK (liker_id <> liked_id)
);

ALTER TABLE public.dating_likes ENABLE ROW LEVEL SECURITY;

-- Can only see likes you sent or received
CREATE POLICY "Users can read own dating likes"
  ON public.dating_likes FOR SELECT
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

-- Can only like if BOTH have a dating profile
CREATE POLICY "Users with dating profile can like"
  ON public.dating_likes FOR INSERT
  WITH CHECK (
    liker_id = auth.uid()
    AND has_dating_profile(auth.uid())
    AND has_dating_profile(liked_id)
  );

CREATE POLICY "Users can unlike"
  ON public.dating_likes FOR DELETE
  USING (liker_id = auth.uid());

-- Trigger for updated_at on dating_profiles
CREATE TRIGGER update_dating_profiles_updated_at
  BEFORE UPDATE ON public.dating_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dating_likes (for instant match notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.dating_likes;
