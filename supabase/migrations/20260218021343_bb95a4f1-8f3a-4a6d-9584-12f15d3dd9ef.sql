
-- Enums
CREATE TYPE public.announcement_category AS ENUM ('entraide', 'sorties', 'logement', 'general');
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_initials TEXT,
  university TEXT,
  city TEXT DEFAULT 'Grenoble',
  interests TEXT[] DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  integration_progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User tasks (checklist persistence)
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, phase_id, task_id)
);

-- User documents (Alpha Vault persistence)
CREATE TABLE public.user_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  owned BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_id)
);

-- Announcements (Hub Social)
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category announcement_category NOT NULL DEFAULT 'general',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connections (matching system)
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_connection CHECK (requester_id != target_id),
  UNIQUE(requester_id, target_id)
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON public.user_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 2))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: users can read all profiles, but only edit their own
CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User tasks RLS
CREATE POLICY "Users can read own tasks" ON public.user_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tasks" ON public.user_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tasks" ON public.user_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User documents RLS
CREATE POLICY "Users can read own documents" ON public.user_documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own documents" ON public.user_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own documents" ON public.user_documents FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Announcements RLS
CREATE POLICY "Authenticated can read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update own announcements" ON public.announcements FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Authors can delete own announcements" ON public.announcements FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Connections RLS
CREATE POLICY "Users can read own connections" ON public.connections FOR SELECT TO authenticated USING (requester_id = auth.uid() OR target_id = auth.uid());
CREATE POLICY "Users can create connections" ON public.connections FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND requester_id != target_id);
CREATE POLICY "Users can update own connections" ON public.connections FOR UPDATE TO authenticated USING (requester_id = auth.uid() OR target_id = auth.uid());
CREATE POLICY "Users can delete own connections" ON public.connections FOR DELETE TO authenticated USING (requester_id = auth.uid() OR target_id = auth.uid());

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
