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

export interface DatingMatch {
  match_id: string;
  partner_id: string;
  partner_name: string;
  partner_initials: string;
  partner_city: string | null;
  partner_university: string | null;
  created_at: string;
}

export function useDating() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myProfile, setMyProfile] = useState<DatingProfile | null>(null);
  const [candidates, setCandidates] = useState<DatingCandidate[]>([]);
  const [matches, setMatches] = useState<DatingMatch[]>([]);
  const [likesReceived, setLikesReceived] = useState<number>(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

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

  const fetchCandidates = useCallback(async () => {
    if (!user || !myProfile) return;
    setLoading(true);

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

    const [{ data: profiles }, { data: myLikes }, { data: receivedLikes }] = await Promise.all([
      supabase.from("profiles_public").select("user_id, display_name, avatar_initials, university, city, interests, is_verified").in("user_id", userIds),
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
        objectifs: [],
      };
    });

    setCandidates(mapped);
    setLoading(false);
  }, [user, myProfile]);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    if (!user) return;

    const { data: rawMatches } = await supabase
      .from("dating_matches")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!rawMatches || rawMatches.length === 0) {
      setMatches([]);
      return;
    }

    const partnerIds = rawMatches.map((m) =>
      m.user_a === user.id ? m.user_b : m.user_a
    );

    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("user_id, display_name, avatar_initials, city, university")
      .in("user_id", partnerIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const mapped: DatingMatch[] = rawMatches.map((m) => {
      const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
      const prof = profileMap.get(partnerId);
      return {
        match_id: m.id,
        partner_id: partnerId,
        partner_name: prof?.display_name || "Anonyme",
        partner_initials: prof?.avatar_initials || "??",
        partner_city: prof?.city || null,
        partner_university: prof?.university || null,
        created_at: m.created_at,
      };
    });

    setMatches(mapped);
  }, [user]);

  useEffect(() => { fetchMyProfile(); }, [fetchMyProfile]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);
  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Realtime for likes + matches
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dating-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "dating_likes" }, () => {
        fetchCandidates();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dating_matches" }, () => {
        fetchMatches();
        toast({ title: "💘 Nouveau match !", description: "Quelqu'un t'a aussi liké ! Découvre ton match." });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCandidates, fetchMatches, toast]);

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
    setCandidates((prev) => prev.map((c) => c.user_id === targetUserId ? { ...c, liked_by_me: !currentlyLiked } : c));
  };

  return {
    myProfile,
    candidates,
    matches,
    likesReceived,
    isPremium,
    loading,
    profileLoading,
    createDatingProfile,
    toggleLike,
    refetch: fetchCandidates,
  };
}