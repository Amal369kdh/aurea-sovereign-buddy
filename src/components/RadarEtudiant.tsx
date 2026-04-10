import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radar, Users, MessageCircle, HandHeart, TrendingUp, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CityStats {
  city: string;
  members: number;
  posts: number;
  entraide: number;
}

const RadarEtudiant = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CityStats[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Get user's city
      const { data: profile } = await supabase
        .from("profiles")
        .select("city")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setUserCity(profile?.city ?? null);

      // Get member counts per city
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("city")
        .not("city", "is", null);

      // Get post counts per category
      const { data: posts } = await supabase
        .from("announcements")
        .select("author_id, category");

      // Get author cities for posts
      const authorIds = [...new Set((posts || []).map(p => p.author_id))];
      const { data: authorProfiles } = await supabase
        .from("profiles_public")
        .select("user_id, city")
        .in("user_id", authorIds);
      
      const authorCityMap = new Map(
        (authorProfiles || []).map(p => [p.user_id, p.city])
      );

      // Aggregate by city
      const cityMap = new Map<string, CityStats>();
      
      (profiles || []).forEach(p => {
        const city = p.city?.trim();
        if (!city) return;
        if (!cityMap.has(city)) {
          cityMap.set(city, { city, members: 0, posts: 0, entraide: 0 });
        }
        cityMap.get(city)!.members++;
      });

      (posts || []).forEach(p => {
        const city = authorCityMap.get(p.author_id)?.trim();
        if (!city || !cityMap.has(city)) return;
        const s = cityMap.get(city)!;
        s.posts++;
        if (p.category === "entraide") s.entraide++;
      });

      const sorted = [...cityMap.values()].sort((a, b) => b.members - a.members).slice(0, 6);
      setStats(sorted);
      setTotalUsers((profiles || []).length);
      setTotalPosts((posts || []).length);
      setLoading(false);
    };

    fetchStats();
  }, [user?.id]);

  if (loading) return null;
  if (stats.length === 0) return null;

  const maxMembers = Math.max(...stats.map(s => s.members), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-border bg-card p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-info/15">
          <Radar className="h-5 w-5 text-info" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Radar Étudiant</h3>
          <p className="text-[11px] text-muted-foreground">Activité en temps réel par ville</p>
        </div>
      </div>

      {/* Global counters */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-primary/5 border border-primary/10 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="h-3 w-3 text-primary" />
          </div>
          <p className="text-lg font-extrabold text-foreground">{totalUsers}</p>
          <p className="text-[10px] text-muted-foreground">Membres</p>
        </div>
        <div className="rounded-2xl bg-info/5 border border-info/10 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <MessageCircle className="h-3 w-3 text-info" />
          </div>
          <p className="text-lg font-extrabold text-foreground">{totalPosts}</p>
          <p className="text-[10px] text-muted-foreground">Publications</p>
        </div>
        <div className="rounded-2xl bg-success/5 border border-success/10 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <HandHeart className="h-3 w-3 text-success" />
          </div>
          <p className="text-lg font-extrabold text-foreground">
            {stats.reduce((sum, s) => sum + s.entraide, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Entraides</p>
        </div>
      </div>

      {/* City bars */}
      <div className="space-y-2.5">
        {stats.map((s, i) => {
          const isMyCity = userCity && s.city.toLowerCase() === userCity.toLowerCase();
          const barWidth = Math.max(12, (s.members / maxMembers) * 100);

          return (
            <motion.div
              key={s.city}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className={`h-3 w-3 ${isMyCity ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-semibold ${isMyCity ? "text-primary" : "text-foreground"}`}>
                    {s.city}
                    {isMyCity && <span className="ml-1 text-[10px] text-primary/70">• ta ville</span>}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {s.members} membre{s.members > 1 ? "s" : ""} · {s.posts} post{s.posts > 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  className={`h-full rounded-full ${
                    isMyCity
                      ? "gold-gradient"
                      : "bg-info/60"
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span>Mis à jour en temps réel — top {stats.length} villes actives</span>
      </div>
    </motion.div>
  );
};

export default RadarEtudiant;
