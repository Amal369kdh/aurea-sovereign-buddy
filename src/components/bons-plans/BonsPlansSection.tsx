import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShoppingCart, Bus, PartyPopper, Home, Lock } from "lucide-react";
import BonsPlansCourses from "./BonsPlansCourses";

type CategoryKey = "courses" | "transports" | "sorties" | "logement";

interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
  icon: typeof ShoppingCart;
  available: boolean;
}

const CATEGORIES: Category[] = [
  { key: "courses", label: "Courses", emoji: "🛒", icon: ShoppingCart, available: true },
  { key: "transports", label: "Transports", emoji: "🚌", icon: Bus, available: false },
  { key: "sorties", label: "Sorties", emoji: "🎉", icon: PartyPopper, available: false },
  { key: "logement", label: "Logement", emoji: "🏠", icon: Home, available: false },
];

const BonsPlansSection = () => {
  const [active, setActive] = useState<CategoryKey>("courses");

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label="Bons plans étudiants"
    >
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Bons Plans 🔥</h2>
          <p className="text-[11px] text-muted-foreground">
            Les deals qui font du bien à ton compte en banque
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.key;
          const isDisabled = !cat.available;
          return (
            <button
              key={cat.key}
              onClick={() => cat.available && setActive(cat.key)}
              disabled={isDisabled}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : isDisabled
                  ? "border-border/40 bg-secondary/30 text-muted-foreground/60 cursor-not-allowed"
                  : "border-border bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {isDisabled && <Lock className="h-2.5 w-2.5" />}
            </button>
          );
        })}
      </div>

      {/* Active content */}
      {active === "courses" && <BonsPlansCourses />}

      {/* Coming soon teaser */}
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Transports, sorties & logement arrivent bientôt 👀
      </p>
    </motion.section>
  );
};

export default BonsPlansSection;