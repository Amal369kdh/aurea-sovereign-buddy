-- Fonction atomique pour vérifier et incrémenter le quota Amal (évite la race condition)
CREATE OR REPLACE FUNCTION public.check_and_increment_aya_usage(
  p_user_id uuid,
  p_is_premium boolean,
  p_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current integer;
  v_allowed boolean;
BEGIN
  SELECT aya_messages_used INTO v_current
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_allowed := p_is_premium OR v_current < p_limit;

  IF v_allowed AND NOT p_is_premium THEN
    UPDATE profiles
    SET aya_messages_used = aya_messages_used + 1
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'used', CASE WHEN v_allowed AND NOT p_is_premium THEN v_current + 1 ELSE v_current END,
    'remaining', CASE WHEN p_is_premium THEN -1 ELSE GREATEST(0, p_limit - v_current - 1) END
  );
END;
$$;

-- Restreindre profiles_public aux utilisateurs authentifiés
ALTER VIEW public.profiles_public OWNER TO postgres;
REVOKE SELECT ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;