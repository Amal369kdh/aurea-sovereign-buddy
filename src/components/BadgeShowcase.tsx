import { motion } from "framer-motion";
import { useBadges } from "@/hooks/useBadges";
import {
  MessageCircle, HeartHandshake, Award, ThumbsUp, Rocket,
  Target, Crown, ShieldCheck, Star, Flame, Lock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ICON_MAP: Record<string, React.ElementType> = {
  "message-circle": MessageCircle,
  "heart-handshake": HeartHandshake,
  "award": Award,
  "thumbs-up": ThumbsUp,
  "rocket": Rocket,
  "target": Target,
  "crown": Crown,
  "shield-check": ShieldCheck,
  "star": Star,
  "flame": Flame,
};

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social",
  integration: "Intégration",
  account: "Compte",
  engagement: "Engagement",
  general: "Général",
};

const BadgeShowcase = () => {
  const { allBadges, loading, isEarned, earnedCount, totalCount } = useBadges();

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="h-2 w-full bg-muted rounded mb-4" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 w-14 bg-muted rounded-2xl mx-auto" />
          ))}
        </div>
      </div>
    );
  }

  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Group by category
  const categories = [...new Set(allBadges.map((b) => b.category))];

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-foreground">Badges 🏅</h3>
        <span className="text-xs font-bold text-primary">
          {earnedCount}/{totalCount}
        </span>
      </div>
      <Progress value={progressPercent} className="h-1.5 mb-4" />

      <div className="space-y-4">
        {categories.map((cat) => {
          const catBadges = allBadges.filter((b) => b.category === cat);
          return (
            <div key={cat}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[cat] || cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {catBadges.map((badge) => {
                  const earned = isEarned(badge.id);
                  const IconComponent = ICON_MAP[badge.icon] || Star;

                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="group relative"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                          earned
                            ? "gold-gradient border-transparent shadow-lg"
                            : "bg-muted/50 border-border/50 opacity-40"
                        }`}
                      >
                        {earned ? (
                          <IconComponent className="h-5 w-5 text-primary-foreground" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                        <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg min-w-[140px] max-w-[180px]">
                          <p className="text-xs font-bold text-foreground whitespace-nowrap">{badge.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{badge.description}</p>
                          {earned && (
                            <p className="text-[9px] text-primary font-bold mt-1">✓ Obtenu</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeShowcase;
