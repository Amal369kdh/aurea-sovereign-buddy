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
  same_city: boolean;
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

export interface DatingQuota {
  is_premium: boolean;
  used: number;
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
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
  const [quota, setQuota] = useState<DatingQuota | null>(null);

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

    const [candidatesRes, receivedRes, quotaRes] = await Promise.all([
      supabase.rpc("get_dating_candidates", { p_limit: 30 }),
      supabase.from("dating_likes").select("id").eq("liked_id", user.id),
      supabase.rpc("get_dating_daily_quota"),
    ]);

    if (candidatesRes.error) {
      const code = candidatesRes.error.message || "";
      if (code.includes("birth_date_required")) {
        toast({ title: "Date de naissance requise", description: "Renseigne-la dans Mon Profil pour les Rencontres.", variant: "destructive" });
      } else if (code.includes("minor_not_allowed")) {
        toast({ title: "Réservé aux 18+", description: "Les Rencontres sont réservées aux majeur·e·s.", variant: "destructive" });
      }
      setCandidates([]);
      setLoading(false);
      return;
    }

    const rows = (candidatesRes.data || []) as Array<{
      user_id: string;
      display_name: string | null;
      avatar_initials: string | null;
      university: string | null;
      city: string | null;
      interests: string[] | null;
      is_verified: boolean | null;
      bio: string | null;
      looking_for: string;
      liked_by_me: boolean;
      same_city: boolean;
    }>;

    const mapped: DatingCandidate[] = rows.map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name || "Anonyme",
      avatar_initials: r.avatar_initials || "??",
      university: r.university,
      city: r.city,
      interests: r.interests || [],
      is_verified: r.is_verified || false,
      bio: r.bio,
      looking_for: r.looking_for,
      liked_by_me: r.liked_by_me,
      objectifs: [],
      same_city: r.same_city,
    }));

    setLikesReceived((receivedRes.data || []).length);
    if (quotaRes.data) setQuota(quotaRes.data as unknown as DatingQuota);
    setCandidates(mapped);
    setLoading(false);
  }, [user, myProfile, toast]);

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
    const { data, error } = await supabase.rpc("toggle_dating_like", {
      p_target_id: targetUserId,
      p_currently_liked: currentlyLiked,
    });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour ton like.", variant: "destructive" });
      return;
    }

    const result = data as { action: string; quota_blocked: boolean; used?: number; limit?: number } | null;
    if (result?.quota_blocked) {
      toast({
        title: "Limite atteinte 💛",
        description: `Tu as utilisé tes ${result.limit ?? 20} likes du jour. Passe Gold pour liker sans limite.`,
        variant: "destructive",
      });
      return;
    }

    setCandidates((prev) => prev.map((c) => c.user_id === targetUserId ? { ...c, liked_by_me: !currentlyLiked } : c));
    // Refresh quota
    const { data: q } = await supabase.rpc("get_dating_daily_quota");
    if (q) setQuota(q as unknown as DatingQuota);
  };

  const updateProfile = async (data: { bio: string; looking_for: string; show_me: string; is_active: boolean }) => {
    const { error } = await supabase.rpc("update_my_dating_profile", {
      p_bio: data.bio,
      p_looking_for: data.looking_for,
      p_show_me: data.show_me,
      p_is_active: data.is_active,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour ton profil.", variant: "destructive" });
      return false;
    }
    toast({ title: "Profil mis à jour ✓" });
    fetchMyProfile();
    return true;
  };

  const deleteProfile = async () => {
    const { error } = await supabase.rpc("delete_my_dating_profile");
    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer ton profil.", variant: "destructive" });
      return false;
    }
    toast({ title: "Profil Rencontres supprimé", description: "Toutes tes données dating ont été effacées." });
    setMyProfile(null);
    setCandidates([]);
    setMatches([]);
    return true;
  };

  const unmatch = async (matchId: string) => {
    const { error } = await supabase.rpc("unmatch_dating", { p_match_id: matchId });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de défaire le match.", variant: "destructive" });
      return false;
    }
    setMatches((prev) => prev.filter((m) => m.match_id !== matchId));
    return true;
  };

  return {
    myProfile,
    candidates,
    matches,
    likesReceived,
    isPremium,
    loading,
    profileLoading,
    quota,
    createDatingProfile,
    toggleLike,
    updateProfile,
    deleteProfile,
    unmatch,
    refetch: fetchCandidates,
  };
}