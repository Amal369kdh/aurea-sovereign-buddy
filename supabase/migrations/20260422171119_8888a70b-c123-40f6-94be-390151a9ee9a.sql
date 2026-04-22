
-- =========================================================
-- 1. RETENTION : 30j sur dating_messages (cohérent avec messages)
-- =========================================================
ALTER TABLE public.dating_messages
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

CREATE INDEX IF NOT EXISTS idx_dating_messages_expires_at ON public.dating_messages(expires_at);

-- =========================================================
-- 2. FUNCTION: get_dating_candidates
--    Filtres serveur : 18+, show_me, ville prio + fallback, exclut matches
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_dating_candidates(p_limit int DEFAULT 30)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_initials text,
  university text,
  city text,
  interests text[],
  is_verified boolean,
  bio text,
  looking_for text,
  liked_by_me boolean,
  same_city boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me_user_id uuid := auth.uid();
  _my_city text;
  _my_show_me text;
  _my_birth date;
  _my_age int;
  _same_city_count int;
BEGIN
  IF _me_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- Lire mes préférences + vérifier majorité serveur
  SELECT p.city, p.birth_date INTO _my_city, _my_birth
  FROM profiles p WHERE p.user_id = _me_user_id;

  IF _my_birth IS NULL THEN
    RAISE EXCEPTION 'birth_date_required' USING ERRCODE = '22023';
  END IF;

  _my_age := DATE_PART('year', AGE(_my_birth))::int;
  IF _my_age < 18 THEN
    RAISE EXCEPTION 'minor_not_allowed' USING ERRCODE = '42501';
  END IF;

  SELECT dp.show_me INTO _my_show_me
  FROM dating_profiles dp WHERE dp.user_id = _me_user_id;

  IF _my_show_me IS NULL THEN
    RAISE EXCEPTION 'no_dating_profile' USING ERRCODE = '42501';
  END IF;

  -- Compter les profils same-city pour décider du fallback
  SELECT COUNT(*) INTO _same_city_count
  FROM dating_profiles dp
  JOIN profiles pr ON pr.user_id = dp.user_id
  WHERE dp.is_active = true
    AND dp.user_id <> _me_user_id
    AND pr.city = _my_city
    AND pr.birth_date IS NOT NULL
    AND DATE_PART('year', AGE(pr.birth_date)) >= 18;

  RETURN QUERY
  SELECT
    dp.user_id,
    pr.display_name,
    pr.avatar_initials,
    pr.university,
    pr.city,
    pr.interests,
    pr.is_verified,
    dp.bio,
    dp.looking_for,
    EXISTS(SELECT 1 FROM dating_likes dl
           WHERE dl.liker_id = _me_user_id AND dl.liked_id = dp.user_id) AS liked_by_me,
    (pr.city = _my_city) AS same_city
  FROM dating_profiles dp
  JOIN profiles pr ON pr.user_id = dp.user_id
  WHERE dp.is_active = true
    AND dp.user_id <> _me_user_id
    AND pr.birth_date IS NOT NULL
    AND DATE_PART('year', AGE(pr.birth_date)) >= 18
    -- Fallback : si <5 profils same-city, on ouvre au national
    AND (
      pr.city = _my_city
      OR _same_city_count < 5
    )
    -- Exclut les profils déjà matchés
    AND NOT EXISTS (
      SELECT 1 FROM dating_matches m
      WHERE (m.user_a = _me_user_id AND m.user_b = dp.user_id)
         OR (m.user_b = _me_user_id AND m.user_a = dp.user_id)
    )
  ORDER BY same_city DESC, RANDOM()
  LIMIT p_limit;
END;
$$;

-- =========================================================
-- 3. FUNCTION: get_dating_daily_quota
--    Renvoie likes restants pour aujourd'hui
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_dating_daily_quota()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _is_premium boolean;
  _used int;
  _limit constant int := 20;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501'; END IF;

  SELECT is_premium INTO _is_premium FROM profiles WHERE user_id = _me;

  SELECT COUNT(*) INTO _used
  FROM dating_likes
  WHERE liker_id = _me
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'Europe/Paris');

  RETURN jsonb_build_object(
    'is_premium', COALESCE(_is_premium, false),
    'used', _used,
    'limit', CASE WHEN _is_premium THEN -1 ELSE _limit END,
    'remaining', CASE WHEN _is_premium THEN -1 ELSE GREATEST(0, _limit - _used) END
  );
END;
$$;

-- =========================================================
-- 4. FUNCTION: toggle_dating_like (avec quota atomique)
-- =========================================================
CREATE OR REPLACE FUNCTION public.toggle_dating_like(p_target_id uuid, p_currently_liked boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _is_premium boolean;
  _used int;
  _limit constant int := 20;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501'; END IF;
  IF p_target_id = _me THEN RAISE EXCEPTION 'cannot_like_self' USING ERRCODE = '22023'; END IF;

  -- UNLIKE : pas de quota
  IF p_currently_liked THEN
    DELETE FROM dating_likes WHERE liker_id = _me AND liked_id = p_target_id;
    RETURN jsonb_build_object('action', 'unliked', 'quota_blocked', false);
  END IF;

  -- LIKE : vérifier quota
  SELECT is_premium INTO _is_premium FROM profiles WHERE user_id = _me FOR UPDATE;

  IF NOT COALESCE(_is_premium, false) THEN
    SELECT COUNT(*) INTO _used
    FROM dating_likes
    WHERE liker_id = _me
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'Europe/Paris');

    IF _used >= _limit THEN
      RETURN jsonb_build_object(
        'action', 'blocked',
        'quota_blocked', true,
        'used', _used,
        'limit', _limit
      );
    END IF;
  END IF;

  -- Insertion (RLS WITH CHECK déjà en place vérifie has_dating_profile)
  INSERT INTO dating_likes (liker_id, liked_id) VALUES (_me, p_target_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('action', 'liked', 'quota_blocked', false);
END;
$$;

-- =========================================================
-- 5. FUNCTION: unmatch_dating
-- =========================================================
CREATE OR REPLACE FUNCTION public.unmatch_dating(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _user_a uuid;
  _user_b uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501'; END IF;

  SELECT user_a, user_b INTO _user_a, _user_b
  FROM dating_matches WHERE id = p_match_id;

  IF _user_a IS NULL THEN RETURN false; END IF;
  IF _me <> _user_a AND _me <> _user_b THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Efface messages, match, et les likes mutuels (pour éviter re-match instant)
  DELETE FROM dating_messages WHERE match_id = p_match_id;
  DELETE FROM dating_matches WHERE id = p_match_id;
  DELETE FROM dating_likes
    WHERE (liker_id = _user_a AND liked_id = _user_b)
       OR (liker_id = _user_b AND liked_id = _user_a);

  RETURN true;
END;
$$;

-- =========================================================
-- 6. FUNCTION: delete_my_dating_profile (RGPD module-only)
-- =========================================================
CREATE OR REPLACE FUNCTION public.delete_my_dating_profile()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501'; END IF;

  -- Efface messages des matchs où je suis impliqué
  DELETE FROM dating_messages
  WHERE match_id IN (
    SELECT id FROM dating_matches WHERE user_a = _me OR user_b = _me
  );

  DELETE FROM dating_matches WHERE user_a = _me OR user_b = _me;
  DELETE FROM dating_likes WHERE liker_id = _me OR liked_id = _me;
  DELETE FROM dating_profiles WHERE user_id = _me;

  RETURN true;
END;
$$;

-- =========================================================
-- 7. FUNCTION: update_my_dating_profile (édition contrôlée)
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_my_dating_profile(
  p_bio text,
  p_looking_for text,
  p_show_me text,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501'; END IF;

  IF p_looking_for NOT IN ('amitie','relation','les_deux') THEN
    RAISE EXCEPTION 'invalid_looking_for' USING ERRCODE = '22023';
  END IF;
  IF p_show_me NOT IN ('tous','hommes','femmes') THEN
    RAISE EXCEPTION 'invalid_show_me' USING ERRCODE = '22023';
  END IF;
  IF p_bio IS NOT NULL AND length(p_bio) > 200 THEN
    RAISE EXCEPTION 'bio_too_long' USING ERRCODE = '22023';
  END IF;

  UPDATE dating_profiles
  SET bio = p_bio,
      looking_for = p_looking_for,
      show_me = p_show_me,
      is_active = p_is_active,
      updated_at = now()
  WHERE user_id = _me;

  RETURN FOUND;
END;
$$;

-- =========================================================
-- 8. CLEANUP : étendre cleanup pour dating_messages expirés
-- =========================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_dating_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM dating_messages WHERE expires_at < now();
END;
$$;
