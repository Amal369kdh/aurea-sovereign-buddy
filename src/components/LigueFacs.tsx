import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CityRank {
  city: string;
  total_points: number;
  member_count: number;
}

const LigueFacs = () => {
  const [rankings, setRankings] = useState<CityRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      // Aggregate points_social by city from public view
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
      setLoading(false);
    };

    fetchRankings();
  }, []);

  if (loading) return null;
  if (rankings.length === 0) return null;

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, 10);
  const medals = ["🥇", "🥈", "🥉"];

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
            <h3 className="text-sm font-bold text-foreground">Ligue des Facs 🏆</h3>
            <p className="text-[10px] text-muted-foreground">Classement par points sociaux cumulés</p>
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
            <div className="mt-4 space-y-2">
              {top3.map((r, i) => (
                <div
                  key={r.university}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    i === 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-secondary/50"
                  }`}
                >
                  <span className="text-lg">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{r.university}</p>
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
              ))}

              {rest.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {rest.map((r, i) => (
                    <div
                      key={r.university}
                      className="flex items-center gap-3 rounded-xl px-4 py-2"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-5 text-right">
                        {i + 4}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{r.university}</p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{r.total_points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground text-center">
              +5 pts par post Entraide · Poste sur le Hub pour représenter ta fac 💪
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LigueFacs;
