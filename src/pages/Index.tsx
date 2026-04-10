import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import SovereigntyWidget from "@/components/SovereigntyWidget";
import BentoGrid from "@/components/BentoGrid";
import SocialPulse from "@/components/SocialPulse";
import BudgetTracker from "@/components/BudgetTracker";
import AdminCalendar from "@/components/AdminCalendar";
import BadgeShowcase from "@/components/BadgeShowcase";
import MentoringWidget from "@/components/MentoringWidget";
import RadarEtudiant from "@/components/RadarEtudiant";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useActiveCities } from "@/hooks/useActiveCities";
import { useNavigate } from "react-router-dom";
import { Users, Sparkles, Globe } from "lucide-react";

const WelcomeModal = ({ onClose, city }: { onClose: () => void; city: string | null }) => {
  const handleEnter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ has_seen_welcome: true }).eq("user_id", user.id);
    }
    onClose();
  };

  const cityLabel = city?.trim() || null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="relative w-full max-w-md rounded-2xl border border-border/40 bg-card/95 p-8 shadow-2xl text-center"
        >
          <div className="mb-4 text-3xl">✨</div>
          <h1
            className="mb-4 text-2xl font-semibold tracking-tight"
            style={{ color: "hsl(43 74% 58%)" }}
          >
            Bienvenue dans le game 🇫🇷
          </h1>
          <p className="mb-2 text-sm font-semibold text-foreground">
            {cityLabel ? `Landing smooth ✈️ — ${cityLabel} t'attend.` : "Landing smooth ✈️"}
          </p>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            Aurea est un espace bienveillant créé par des étudiants, pour les étudiants. Tu es à ta place. On est là à chaque étape.
          </p>
          <Button
            onClick={handleEnter}
            className="w-full"
            style={{
              background: "linear-gradient(135deg, hsl(43 74% 52%), hsl(43 74% 42%))",
              color: "hsl(0 0% 8%)",
              fontWeight: 600,
            }}
          >
            Let's go 🚀
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [showCityBanner, setShowCityBanner] = useState(false);
  const { flags } = useFeatureFlags();
  const { activeCities } = useActiveCities();
  const hubSocialEnabled = flags["hub_social"] !== false;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("has_seen_welcome, city, target_city")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const city = data.city ?? null;
          setProfileCity(city);
          if (data.has_seen_welcome === false) {
            setShowWelcome(true);
          }
          // Show banner only if user's city is NOT active
          const effectiveCity = city ?? data.target_city;
          if (effectiveCity && !activeCities.includes(effectiveCity.toLowerCase().trim())) {
            setShowCityBanner(true);
          } else {
            setShowCityBanner(false);
          }
        }
      });
  }, [user?.id, activeCities]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />

        <div className="px-6 pb-28">
          {/* City banner for non-Grenoble users */}
          <AnimatePresence>
            {showCityBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-start gap-4 rounded-3xl border border-primary/25 bg-primary/5 px-5 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gold-gradient">
                  <Globe className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Ta ville arrive bientôt 🌍
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    L'expérimentation démarre à Grenoble. D'autres villes rejoindront très prochainement — tu seras parmi les premiers informés.
                  </p>
                </div>
                <button
                  onClick={() => setShowCityBanner(false)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick action buttons */}
          <div className="mb-4 flex items-center gap-2">
            {hubSocialEnabled && (
              <button
                onClick={() => navigate("/hub-social")}
                className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
              >
                <Users className="h-3 w-3" />
                Hub Social
              </button>
            )}
            <button
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>("[data-amal-trigger]");
                btn?.click();
              }}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              Amal
            </button>
          </div>
          <div className="mb-4">
            <SovereigntyWidget />
          </div>
          <div className="mb-4">
            <AdminCalendar />
          </div>
          <div className="mb-4">
            <BudgetTracker />
          </div>
          <BentoGrid />
          <div className="mt-4 space-y-4">
            <RadarEtudiant />
            <BadgeShowcase />
            <MentoringWidget />
          </div>
          {hubSocialEnabled && (
            <div className="mt-4">
              <SocialPulse />
            </div>
          )}
        </div>
      </main>

      <SecuritySovereign />
      <AmalTrigger />
      <MobileBottomNav />

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} city={profileCity} />}
    </div>
  );
};

export default Index;
