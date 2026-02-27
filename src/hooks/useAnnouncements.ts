import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type AnnouncementCategory = "entraide" | "sorties" | "logement" | "general";

export interface Announcement {
  id: string;
  content: string;
  category: AnnouncementCategory;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  author_id: string;
  author_name: string;
  author_initials: string;
  author_university: string | null;
  author_verified: boolean;
  liked_by_me: boolean;
}

export function useAnnouncements(filterCategory: AnnouncementCategory | "all") {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("announcements")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }

    const { data: posts, error } = await query;
    if (error) {
      console.error("Error fetching announcements:", error);
      setLoading(false);
      return;
    }

    if (!posts || posts.length === 0) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    // Fetch author profiles (vue publique)
    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("user_id, display_name, avatar_initials, university, is_verified")
      .in("user_id", authorIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Fetch my likes
    const { data: myLikes } = await supabase
      .from("announcement_likes")
      .select("announcement_id")
      .eq("user_id", user.id);

    const likedSet = new Set((myLikes || []).map((l) => l.announcement_id));

    const mapped: Announcement[] = posts.map((post) => {
      const profile = profileMap.get(post.author_id);
      return {
        id: post.id,
        content: post.content,
        category: post.category,
        likes_count: post.likes_count,
        comments_count: post.comments_count ?? 0,
        is_pinned: post.is_pinned ?? false,
        created_at: post.created_at,
        author_id: post.author_id,
        author_name: profile?.display_name || "Anonyme",
        author_initials: profile?.avatar_initials || "??",
        author_university: profile?.university || null,
        author_verified: profile?.is_verified || false,
        liked_by_me: likedSet.has(post.id),
      };
    });

    setAnnouncements(mapped);
    setLoading(false);
  }, [user, filterCategory]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnnouncements]);

  const createPost = async (content: string, category: AnnouncementCategory) => {
    if (!user) return;
    const { error } = await supabase.from("announcements").insert({
      content,
      category,
      author_id: user.id,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de publier.", variant: "destructive" });
    } else {
      toast({ title: "Publié ✨", description: "Ton message est en ligne." });
    }
  };

  const toggleLike = async (announcementId: string, currentlyLiked: boolean) => {
    if (!user) return;
    if (currentlyLiked) {
      await supabase
        .from("announcement_likes")
        .delete()
        .eq("announcement_id", announcementId)
        .eq("user_id", user.id);

      await supabase
        .from("announcements")
        .update({ likes_count: Math.max(0, (announcements.find(a => a.id === announcementId)?.likes_count || 1) - 1) })
        .eq("id", announcementId);
    } else {
      await supabase
        .from("announcement_likes")
        .insert({ announcement_id: announcementId, user_id: user.id });

      await supabase
        .from("announcements")
        .update({ likes_count: (announcements.find(a => a.id === announcementId)?.likes_count || 0) + 1 })
        .eq("id", announcementId);
    }

    // Optimistic update
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === announcementId
          ? {
              ...a,
              liked_by_me: !currentlyLiked,
              likes_count: currentlyLiked
                ? Math.max(0, a.likes_count - 1)
                : a.likes_count + 1,
            }
          : a
      )
    );
  };

  return { announcements, loading, createPost, toggleLike, refetch: fetchAnnouncements };
}
