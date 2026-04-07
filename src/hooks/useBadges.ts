import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/contexts/IntegrationContext";

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export const useBadges = () => {
  const { user } = useAuth();
  const { progress, isTemoin } = useIntegration();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all badges + user's earned badges
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [badgesRes, earnedRes] = await Promise.all([
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id),
      ]);

      if (badgesRes.data) setAllBadges(badgesRes.data as Badge[]);
      if (earnedRes.data) setEarnedBadges(earnedRes.data as UserBadge[]);
      setLoading(false);
    };

    load();
  }, [user]);

  // Check and award badges based on current state
  const checkAndAward = useCallback(async () => {
    if (!user) return;

    const earned = new Set(earnedBadges.map((b) => b.badge_id));
    const toAward: string[] = [];

    // Dossier progress badges
    if (progress >= 25 && !earned.has("dossier_25")) toAward.push("dossier_25");
    if (progress >= 50 && !earned.has("dossier_50")) toAward.push("dossier_50");
    if (progress >= 100 && !earned.has("dossier_100")) toAward.push("dossier_100");

    // Verified badge
    if (isTemoin && !earned.has("verified")) toAward.push("verified");

    // Social points badge
    const { data: profile } = await supabase
      .from("profiles")
      .select("points_social")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile && (profile.points_social || 0) >= 50 && !earned.has("social_50")) {
      toAward.push("social_50");
    }

    // Post count badges
    const { count: postCount } = await supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("category", "entraide");

    if (postCount && postCount >= 1 && !earned.has("first_post")) toAward.push("first_post");
    if (postCount && postCount >= 5 && !earned.has("helper_5")) toAward.push("helper_5");
    if (postCount && postCount >= 20 && !earned.has("helper_20")) toAward.push("helper_20");

    // Likes received badge
    const { data: userPosts } = await supabase
      .from("announcements")
      .select("likes_count")
      .eq("author_id", user.id);

    const totalLikes = userPosts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
    if (totalLikes >= 10 && !earned.has("liked_10")) toAward.push("liked_10");

    // Award new badges
    if (toAward.length > 0) {
      const inserts = toAward.map((badge_id) => ({
        user_id: user.id,
        badge_id,
      }));

      const { data: inserted } = await supabase.from("user_badges").insert(inserts).select("badge_id, earned_at");
      if (inserted) {
        setEarnedBadges((prev) => [...prev, ...(inserted as UserBadge[])]);
      }
    }

    return toAward;
  }, [user, earnedBadges, progress, isTemoin]);

  // Auto-check on mount
  useEffect(() => {
    if (!loading && user) {
      checkAndAward();
    }
  }, [loading, user]);

  const earnedSet = new Set(earnedBadges.map((b) => b.badge_id));

  return {
    allBadges,
    earnedBadges,
    loading,
    isEarned: (badgeId: string) => earnedSet.has(badgeId),
    earnedCount: earnedBadges.length,
    totalCount: allBadges.length,
    checkAndAward,
  };
};
