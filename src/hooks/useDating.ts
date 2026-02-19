import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface DatingProfile {
  id: string;
  user_id: string;
  bio: string | null;
  looking_for: string;
  age_min: number;
  age_max: number;
  show_me: string;
  is_active: boolean;
}

export interface DatingCandidate {
  user_id: string;
  display_name: string;
  avatar_initials: string;
  university: string | null;
  city: string | null;
  interests: string[];
  is_verified: boolean;
  bio: string | null;
  looking_for: string;
  liked_by_me: boolean;
  objectifs: string[];
}

export function useDating() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myProfile, setMyProfile] = useState<DatingProfile | null>(null);
  const [candidates, setCandidates] = useState<DatingCandidate[]>([]);
  const [likesReceived, setLikesReceived] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch my dating profile + premium status
  const fetchMyProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);

    const [{ data: dp }, { data: prof }] = await Promise.all([
      supabase.from("dating_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("is_premium").eq("user_id", user.id).single(),
    ]);

    setMyProfile(dp as DatingProfile | null);
    setIsPremium(prof?.is_premium || false);
    setProfileLoading(false);
  }, [user]);

  // Fetch candidates (users with active dating profiles, excluding self)
  const fetchCandidates = useCallback(async () => {
    if (!user || !myProfile) return;
    setLoading(true);

    // Get all active dating profiles except mine
    const { data: datingProfiles } = await supabase
      .from("dating_profiles")
      .select("user_id, bio, looking_for")
      .eq("is_active", true)
      .neq("user_id", user.id)
      .limit(50);

    if (!datingProfiles || datingProfiles.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const userIds = datingProfiles.map((dp) => dp.user_id);

    // Fetch profiles + my likes in parallel
    const [{ data: profiles }, { data: myLikes }, { data: receivedLikes }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_initials, university, city, interests, is_verified, objectifs").in("user_id", userIds),
      supabase.from("dating_likes").select("liked_id").eq("liker_id", user.id),
      supabase.from("dating_likes").select("id").eq("liked_id", user.id),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const likedSet = new Set((myLikes || []).map((l) => l.liked_id));
    setLikesReceived((receivedLikes || []).length);

    const mapped: DatingCandidate[] = datingProfiles.map((dp) => {
      const prof = profileMap.get(dp.user_id);
      return {
        user_id: dp.user_id,
        display_name: prof?.display_name || "Anonyme",
        avatar_initials: prof?.avatar_initials || "??",
        university: prof?.university || null,
        city: prof?.city || null,
        interests: prof?.interests || [],
        is_verified: prof?.is_verified || false,
        bio: dp.bio,
        looking_for: dp.looking_for,
        liked_by_me: likedSet.has(dp.user_id),
        objectifs: prof?.objectifs || [],
      };
    });

    setCandidates(mapped);
    setLoading(false);
  }, [user, myProfile]);

  useEffect(() => { fetchMyProfile(); }, [fetchMyProfile]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // Realtime for new likes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dating-likes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "dating_likes" }, () => {
        fetchCandidates();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCandidates]);

  const createDatingProfile = async (data: { bio: string; looking_for: string; show_me: string }) => {
    if (!user) return;
    const { error } = await supabase.from("dating_profiles").insert({
      user_id: user.id,
      bio: data.bio,
      looking_for: data.looking_for,
      show_me: data.show_me,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer le profil.", variant: "destructive" });
    } else {
      toast({ title: "Profil créé 💫", description: "Tu es maintenant visible dans les rencontres." });
      fetchMyProfile();
    }
  };

  const toggleLike = async (targetUserId: string, currentlyLiked: boolean) => {
    if (!user) return;
    if (currentlyLiked) {
      await supabase.from("dating_likes").delete().eq("liker_id", user.id).eq("liked_id", targetUserId);
    } else {
      const { error } = await supabase.from("dating_likes").insert({ liker_id: user.id, liked_id: targetUserId });
      if (error) {
        toast({ title: "Erreur", description: error.message.includes("dating_profile") ? "Profil rencontre requis." : "Impossible de liker.", variant: "destructive" });
        return;
      }
    }
    // Optimistic update
    setCandidates((prev) => prev.map((c) => c.user_id === targetUserId ? { ...c, liked_by_me: !currentlyLiked } : c));
  };

  return {
    myProfile,
    candidates,
    likesReceived,
    isPremium,
    loading,
    profileLoading,
    createDatingProfile,
    toggleLike,
    refetch: fetchCandidates,
  };
}
