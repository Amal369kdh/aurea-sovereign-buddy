import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, TrendingUp, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CityRank {
  city: string;
  total_points: number;
  member_count: number;
}

const LigueFacs = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<CityRank[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      // Fetch all cities + points from public view (no PII exposed)
      const { data } = await supabase
        .from("profiles_public")
        .select("city, points_social");

      if (data) {
        const map = new Map<string, { total: number; count: number }>();
        for (const row of data) {
          const c = row.city?.trim();
          if (!c || c.length < 2) continue;
          const existing = map.get(c) || { total: 0, count: 0 };
          existing.total += (row.points_social || 0);
          existing.count += 1;
          map.set(c, existing);
        }

        const sorted = Array.from(map.entries())
          .map(([city, { total, count }]) => ({
            city,
            total_points: total,
            member_count: count,
          }))
          .filter((r) => r.member_count >= 1)
          .sort((a, b) => b.total_points - a.total_points);

        setRankings(sorted);
      }

      // Get user's city from their own profile (RLS-safe)
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.city) setUserCity(profile.city.trim());
      }

      setLoading(false);
    };

    fetchRankings();
  }, [user?.id]);

  if (loading) return null;
  if (rankings.length === 0) return null;

  const top10 = rankings.slice(0, 10);
  const medals = ["🥇", "🥈", "🥉"];

  // User's city rank (1-indexed)
  const userCityRank = userCity
    ? rankings.findIndex((r) => r.city.toLowerCase() === userCity.toLowerCase()) + 1
    : 0;
  const userCityData = userCityRank > 0 ? rankings[userCityRank - 1] : null;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 mb-5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">Ligue des Villes 🏆</h3>
            <p className="text-[10px] text-muted-foreground">Classement national par points sociaux cumulés</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* User's city highlight */}
            {userCityData && userCityRank > 0 && (
              <div className="mt-4 mb-3 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary">
                    Ta ville : {userCityData.city}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Rang #{userCityRank} sur {rankings.length} villes · {userCityData.member_count} membre{userCityData.member_count > 1 ? "s" : ""} · {userCityData.total_points} pts
                  </p>
                </div>
                {userCityRank <= 3 && <span className="text-lg">{medals[userCityRank - 1]}</span>}
              </div>
            )}

            {/* National Top 10 */}
            <div className={`${!userCityData ? 'mt-4' : ''} space-y-2`}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                🇫🇷 Classement national
              </p>
              {top10.map((r, i) => {
                const isUserCity = userCity && r.city.toLowerCase() === userCity.toLowerCase();
                return (
                  <div
                    key={r.city}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                      isUserCity
                        ? "border-primary/40 bg-primary/10"
                        : i < 3
                          ? i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/50"
                          : "border-transparent"
                    }`}
                  >
                    {i < 3 ? (
                      <span className="text-lg w-6 text-center">{medals[i]}</span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                        {i + 1}.
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-bold truncate ${isUserCity ? 'text-primary' : 'text-foreground'}`}>
                          {r.city}
                        </p>
                        {isUserCity && <MapPin className="h-3 w-3 shrink-0 text-primary" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {r.member_count} membre{r.member_count > 1 ? "s" : ""} actif{r.member_count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-sm font-bold text-primary">{r.total_points}</span>
                      <span className="text-[10px] text-muted-foreground">pts</span>
                    </div>
                  </div>
                );
              })}

              {/* If user's city is not in top 10, show it at the bottom */}
              {userCityData && userCityRank > 10 && (
                <>
                  <div className="flex items-center justify-center py-1">
                    <span className="text-[10px] text-muted-foreground">···</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
                    <span className="text-xs font-bold text-primary w-6 text-center">
                      {userCityRank}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-primary truncate">{userCityData.city}</p>
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {userCityData.member_count} membre{userCityData.member_count > 1 ? "s" : ""} actif{userCityData.member_count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-sm font-bold text-primary">{userCityData.total_points}</span>
                      <span className="text-[10px] text-muted-foreground">pts</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              +5 pts par post Entraide · Poste sur le Hub pour représenter ta ville 💪
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LigueFacs;
