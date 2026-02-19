
-- Comments table for announcements
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read comments"
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments"
ON public.comments FOR DELETE USING (author_id = auth.uid());

-- Only post author can mark a comment as solution
CREATE POLICY "Post author can update is_solution"
ON public.comments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.announcements
    WHERE announcements.id = comments.announcement_id
    AND announcements.author_id = auth.uid()
  )
);

-- Solution conversations: limited DM channel triggered by marking a solution
CREATE TABLE public.solution_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  post_author_id UUID NOT NULL,
  helper_id UUID NOT NULL,
  post_author_msg_count INTEGER NOT NULL DEFAULT 0,
  helper_msg_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id)
);

ALTER TABLE public.solution_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read own solution conversations"
ON public.solution_conversations FOR SELECT
USING (post_author_id = auth.uid() OR helper_id = auth.uid());

CREATE POLICY "System can create solution conversations"
ON public.solution_conversations FOR INSERT
WITH CHECK (post_author_id = auth.uid());

CREATE POLICY "Participants can update msg counts"
ON public.solution_conversations FOR UPDATE
USING (post_author_id = auth.uid() OR helper_id = auth.uid());

-- Solution messages: limited to 3 per participant
CREATE TABLE public.solution_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.solution_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.solution_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read solution messages"
ON public.solution_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solution_conversations sc
    WHERE sc.id = solution_messages.conversation_id
    AND (sc.post_author_id = auth.uid() OR sc.helper_id = auth.uid())
  )
);

CREATE POLICY "Participants can send solution messages within limit"
ON public.solution_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.solution_conversations sc
    WHERE sc.id = solution_messages.conversation_id
    AND (sc.post_author_id = auth.uid() OR sc.helper_id = auth.uid())
    AND CASE
      WHEN sc.post_author_id = auth.uid() THEN sc.post_author_msg_count < 3
      ELSE sc.helper_msg_count < 3
    END
  )
);

-- Trigger to increment msg count on solution message insert
CREATE OR REPLACE FUNCTION public.increment_solution_msg_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.solution_conversations
  SET 
    post_author_msg_count = CASE WHEN post_author_id = NEW.sender_id THEN post_author_msg_count + 1 ELSE post_author_msg_count END,
    helper_msg_count = CASE WHEN helper_id = NEW.sender_id THEN helper_msg_count + 1 ELSE helper_msg_count END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_solution_message_insert
AFTER INSERT ON public.solution_messages
FOR EACH ROW EXECUTE FUNCTION public.increment_solution_msg_count();

-- Trigger to increment comments_count on announcements
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.announcements SET comments_count = comments_count + 1 WHERE id = NEW.announcement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.announcements SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.announcement_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

-- Enable realtime for comments and solution_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solution_messages;
