import { useState, useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import SocialFeed from "@/components/SocialFeed";
import DatingGrid from "@/components/DatingGrid";
import DatingMatches from "@/components/DatingMatches";
import GoldModal from "@/components/GoldModal";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useDating } from "@/hooks/useDating";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, Heart, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "hub" | "rencontres" | "matchs";

const HubSocial = () => {
  const [tab, setTab] = useState<Tab>("hub");
  const [category, setCategory] = useState<"all" | "entraide" | "sorties" | "logement" | "general">("all");
  const [goldOpen, setGoldOpen] = useState(false);
  const { matches, isPremium } = useDating();
  const { flags } = useFeatureFlags();
  const datingEnabled = flags["dating"] !== false;
  const { user } = useAuth();

  // Check verification status for banner / tab gate
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setIsVerified(false); return; }

    // Initial fetch
    supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const s = (data as { status: string } | null)?.status ?? "explorateur";
        setIsVerified(s === "temoin" || s === "admin");
      });

    // Realtime: auto-update when status changes (e.g. student email verified in another tab)
    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          setIsVerified(newStatus === "temoin" || newStatus === "admin");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // If user clicks Rencontres/Matchs tab while not verified, redirect to hub
  const handleTabClick = (t: Tab) => {
    if ((t === "rencontres" || t === "matchs") && !isVerified) return;
    setTab(t);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-2xl font-extrabold text-foreground">Hub Social</h1>
          <p className="text-sm text-muted-foreground">Connecte-toi avec les étudiants de ta ville.</p>

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleTabClick("hub")}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                tab === "hub"
                  ? "gold-gradient text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Users className="h-4 w-4" /> Hub
            </button>
            <button
              onClick={() => handleTabClick("rencontres")}
              disabled={!isVerified}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                !isVerified
                  ? "bg-secondary/40 text-muted-foreground cursor-not-allowed opacity-50"
                  : tab === "rencontres"
                  ? "gold-gradient text-primary-foreground cursor-pointer"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
              }`}
            >
              <Heart className="h-4 w-4" /> Rencontres
              {!datingEnabled && isVerified && <Zap className="h-3 w-3 text-primary" />}
            </button>
            <button
              onClick={() => handleTabClick("matchs")}
              disabled={!isVerified}
              className={`relative flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                !isVerified
                  ? "bg-secondary/40 text-muted-foreground cursor-not-allowed opacity-50"
                  : tab === "matchs"
                  ? "gold-gradient text-primary-foreground cursor-pointer"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Matchs
              {matches.length > 0 && isVerified && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {matches.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 pb-24">
          {/* Soft banner for unverified users on Hub tab */}
          <AnimatePresence>
            {tab === "hub" && isVerified === false && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu vois ce qui se passe ici 👀 —{" "}
                  <span className="font-semibold text-foreground">
                    vérifie ton email étudiant pour rejoindre la conversation
                  </span>{" "}
                  et débloquer les Rencontres.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {tab === "hub" ? (
            <SocialFeed activeCategory={category} onCategoryChange={setCategory} readOnly={!isVerified} />
          ) : tab === "rencontres" ? (
            datingEnabled ? (
              <DatingGrid onConnectClick={() => setGoldOpen(true)} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Zap className="h-10 w-10 text-primary" />
                <p className="text-lg font-bold text-foreground">Bientôt disponible ⚡</p>
                <p className="text-sm text-muted-foreground">La fonctionnalité Rencontres arrive très bientôt.</p>
              </div>
            )
          ) : (
            <DatingMatches matches={matches} isPremium={isPremium} onGoldClick={() => setGoldOpen(true)} />
          )}
        </div>
      </main>

      <SecuritySovereign />
      <AmalTrigger />
      <GoldModal open={goldOpen} onClose={() => setGoldOpen(false)} />
      <MobileBottomNav />
    </div>
  );
};

export default HubSocial;
