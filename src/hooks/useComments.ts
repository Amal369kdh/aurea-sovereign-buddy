import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Comment {
  id: string;
  announcement_id: string;
  author_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  author_name: string;
  author_initials: string;
  author_verified: boolean;
}

export function useComments(announcementId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!announcementId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("announcement_id", announcementId)
      .order("is_solution", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set(data.map((c) => c.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_initials, is_verified")
      .in("user_id", authorIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setComments(
      data.map((c) => {
        const profile = profileMap.get(c.author_id);
        return {
          id: c.id,
          announcement_id: c.announcement_id,
          author_id: c.author_id,
          content: c.content,
          is_solution: c.is_solution,
          created_at: c.created_at,
          author_name: profile?.display_name || "Anonyme",
          author_initials: profile?.avatar_initials || "??",
          author_verified: profile?.is_verified || false,
        };
      })
    );
    setLoading(false);
  }, [announcementId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime
  useEffect(() => {
    if (!announcementId) return;
    const channel = supabase
      .channel(`comments-${announcementId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `announcement_id=eq.${announcementId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [announcementId, fetchComments]);

  const addComment = async (content: string) => {
    if (!user || !announcementId) return;
    const { error } = await supabase.from("comments").insert({
      announcement_id: announcementId,
      author_id: user.id,
      content,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de commenter.", variant: "destructive" });
    }
  };

  const markAsSolution = async (commentId: string, helperId: string) => {
    if (!user || !announcementId) return;

    // Update comment
    const { error: updateError } = await supabase
      .from("comments")
      .update({ is_solution: true })
      .eq("id", commentId);

    if (updateError) {
      toast({ title: "Erreur", description: "Impossible de marquer comme solution.", variant: "destructive" });
      return;
    }

    // Create solution conversation
    const { error: convError } = await supabase.from("solution_conversations").insert({
      announcement_id: announcementId,
      comment_id: commentId,
      post_author_id: user.id,
      helper_id: helperId,
    });

    if (convError && !convError.message.includes("duplicate")) {
      console.error("Error creating solution conversation:", convError);
    }

    toast({ title: "Solution marquée ✅", description: "Un canal privé (3 messages max) a été ouvert entre vous." });
    fetchComments();
  };

  return { comments, loading, addComment, markAsSolution, refetch: fetchComments };
}
