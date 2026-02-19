
-- 1. Add points_social to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_social integer NOT NULL DEFAULT 0;

-- 2. Create resources category enum
CREATE TYPE public.resource_category AS ENUM ('jobs', 'alternance', 'sante', 'social', 'reorientation');

-- 3. Create organizations table (verified companies)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Users can create their organization" ON public.organizations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own organization" ON public.organizations FOR UPDATE USING (user_id = auth.uid());

-- 4. Create resources_links table
CREATE TABLE public.resources_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  description text,
  category resource_category NOT NULL DEFAULT 'social',
  created_by uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  is_verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resources_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read resources" ON public.resources_links FOR SELECT USING (true);
CREATE POLICY "Users can create resources" ON public.resources_links FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Authors can update own resources" ON public.resources_links FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Authors can delete own resources" ON public.resources_links FOR DELETE USING (created_by = auth.uid());

-- Security definer function: check if user belongs to a verified org
CREATE OR REPLACE FUNCTION public.is_verified_organization(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE user_id = _user_id AND is_verified = true
  )
$$;

-- Only verified orgs can publish in jobs/alternance
CREATE POLICY "Only verified orgs can publish jobs" ON public.resources_links
  FOR INSERT
  WITH CHECK (
    CASE 
      WHEN category IN ('jobs', 'alternance') THEN public.is_verified_organization(auth.uid())
      ELSE created_by = auth.uid()
    END
  );

-- 5. Create messages table (ephemeral, text only)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND sender_id <> receiver_id);
CREATE POLICY "Users can delete own sent messages" ON public.messages FOR DELETE USING (sender_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Add expires_at to announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS expires_at timestamptz;
