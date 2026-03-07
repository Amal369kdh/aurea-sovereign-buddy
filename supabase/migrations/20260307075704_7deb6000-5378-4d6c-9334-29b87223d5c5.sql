
-- ============================================================
-- 1. Recreate "Users can read own profile" (DROP + CREATE)
-- ============================================================
DO $$
BEGIN
  -- Drop if exists to avoid conflicts
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
END $$;

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());
