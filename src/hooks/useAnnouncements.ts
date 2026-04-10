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
      .select("*, display_author_name")
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

    // Fetch author profiles via la vue publique (accessible à tous les auth)
    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("user_id, display_name, avatar_initials, university, is_verified, status")
      .in("user_id", authorIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Pour les auteurs dont le profil n'est pas dans la vue publique (admins vus par d'autres),
    // on récupère leur statut via la fonction sécurisée get_own_profile_status n'est pas applicable ici,
    // donc on détermine le statut admin par le fait que l'auteur a posté (les admins peuvent toujours poster).
    // On identifie les auteurs manquants et on fait une requête séparée pour leur statut.
    const missingAuthorIds = authorIds.filter((id) => !profileMap.has(id));
    const adminStatusMap = new Map<string, boolean>();

    if (missingAuthorIds.length > 0) {
      // Vérifie via RPC is_admin pour chaque auteur manquant
      const adminChecks = await Promise.all(
        missingAuthorIds.map(async (id) => {
          const { data } = await supabase.rpc("is_admin", { _user_id: id });
          return { id, isAdmin: !!data };
        })
      );
      adminChecks.forEach(({ id, isAdmin }) => adminStatusMap.set(id, isAdmin));
    }

    // Fetch my likes
    const { data: myLikes } = await supabase
      .from("announcement_likes")
      .select("announcement_id")
      .eq("user_id", user.id);

    const likedSet = new Set((myLikes || []).map((l) => l.announcement_id));

    const mapped: Announcement[] = posts.map((post) => {
      const profile = profileMap.get(post.author_id);
      const status = (profile as { status?: string } | undefined)?.status || "explorateur";
      const isAdmin = status === "admin" || adminStatusMap.get(post.author_id) === true;
      const isTemoinOrAdmin = status === "temoin" || isAdmin;

      // Si un nom fictif est défini (publication #ASM de démo), l'utiliser
      const fakeAuthorName = (post as any).display_author_name as string | null | undefined;
      const displayName = fakeAuthorName
        ? fakeAuthorName
        : isAdmin
          ? "Équipe Aurea"
          : (profile?.display_name || "Anonyme");

      const initials = fakeAuthorName
        ? fakeAuthorName.slice(0, 2).toUpperCase()
        : isAdmin
          ? "AU"
          : (profile?.avatar_initials || "?");

      return {
        id: post.id,
        content: post.content,
        category: post.category,
        likes_count: post.likes_count,
        comments_count: post.comments_count ?? 0,
        is_pinned: post.is_pinned ?? false,
        created_at: post.created_at,
        author_id: post.author_id,
        author_name: displayName,
        author_initials: initials,
        author_university: fakeAuthorName ? null : (isAdmin ? null : (profile?.university || null)),
        // Les publications avec display_author_name (ex: #ASM) s'affichent toujours avec leur pseudo fictif
        author_verified: fakeAuthorName ? true : isTemoinOrAdmin,
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

  const deletePost = async (announcementId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    } else {
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      toast({ title: "Supprimé", description: "Publication supprimée." });
    }
  };

  const toggleLike = async (announcementId: string, currentlyLiked: boolean) => {
    if (!user) return;

    // Optimistic update first
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

    // DB trigger auto-updates likes_count on announcements
    if (currentlyLiked) {
      await supabase
        .from("announcement_likes")
        .delete()
        .eq("announcement_id", announcementId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("announcement_likes")
        .insert({ announcement_id: announcementId, user_id: user.id });
    }
  };

  return { announcements, loading, createPost, deletePost, toggleLike, refetch: fetchAnnouncements };
}
