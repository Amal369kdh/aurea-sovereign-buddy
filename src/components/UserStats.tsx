import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, MessageSquare, Heart, FileText, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  posts_count: number;
  comments_count: number;
  likes_received: number;
  points_social: number;
  city_rank: number;
  total_cities: number;
  city: string | null;
}

const UserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Parallel queries for stats
      const [postsRes, commentsRes, profileRes, citiesRes] = await Promise.all([
        supabase.from("announcements").select("id, likes_count", { count: "exact" }).eq("author_id", user.id),
        supabase.from("comments").select("id", { count: "exact" }).eq("author_id", user.id),
        supabase.from("profiles").select("points_social, city").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles_public").select("city, points_social"),
      ]);

      const posts = postsRes.data || [];
      const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

      // City ranking
      let cityRank = 0;
      let totalCities = 0;
      const userCity = profileRes.data?.city?.trim();
      if (userCity && citiesRes.data) {
        const map = new Map<string, number>();
        for (const row of citiesRes.data) {
          const c = row.city?.trim();
          if (!c) continue;
          map.set(c, (map.get(c) || 0) + (row.points_social || 0));
        }
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        totalCities = sorted.length;
        cityRank = sorted.findIndex(([c]) => c.toLowerCase() === userCity.toLowerCase()) + 1;
      }

      setStats({
        posts_count: postsRes.count || 0,
        comments_count: commentsRes.count || 0,
        likes_received: totalLikes,
        points_social: profileRes.data?.points_social || 0,
        city_rank: cityRank,
        total_cities: totalCities,
        city: userCity || null,
      });
      setLoading(false);
    };

    fetchStats();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: FileText, label: "Posts publiés", value: stats.posts_count, color: "text-primary" },
    { icon: MessageSquare, label: "Commentaires", value: stats.comments_count, color: "text-info" },
    { icon: Heart, label: "Likes reçus", value: stats.likes_received, color: "text-destructive" },
    { icon: TrendingUp, label: "Points sociaux", value: stats.points_social, color: "text-success" },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient">
          <Trophy className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Tes statistiques 📊</h3>
          <p className="text-[10px] text-muted-foreground">Ton activité sur la plateforme</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3"
          >
            <card.icon className={`h-4 w-4 shrink-0 ${card.color}`} />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {stats.city && stats.city_rank > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5"
        >
          <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-primary">
            <span className="font-bold">{stats.city}</span> est #{stats.city_rank} sur {stats.total_cities} villes
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UserStats;
