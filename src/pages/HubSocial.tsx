import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import SocialFeed from "@/components/SocialFeed";
import DatingGrid from "@/components/DatingGrid";
import DatingMatches from "@/components/DatingMatches";
import GoldModal from "@/components/GoldModal";
import MobileBottomNav from "@/components/MobileBottomNav";
import VerifiedGate from "@/components/VerifiedGate";
import { useDating } from "@/hooks/useDating";
import { Users, Heart, Sparkles } from "lucide-react";

type Tab = "hub" | "rencontres" | "matchs";

const HubSocial = () => {
  const [tab, setTab] = useState<Tab>("hub");
  const [category, setCategory] = useState<"all" | "entraide" | "sorties" | "logement" | "general">("all");
  const [goldOpen, setGoldOpen] = useState(false);
  const { matches, isPremium } = useDating();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <VerifiedGate featureName="le Hub Social & Rencontres">
          {/* Header */}
          <div className="border-b border-border px-6 py-5">
            <h1 className="text-2xl font-extrabold text-foreground">Hub Social</h1>
            <p className="text-sm text-muted-foreground">Connecte-toi avec les étudiants de ta ville.</p>

            {/* Tabs */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setTab("hub")}
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  tab === "hub"
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Users className="h-4 w-4" /> Hub
              </button>
              <button
                onClick={() => setTab("rencontres")}
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  tab === "rencontres"
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Heart className="h-4 w-4" /> Rencontres
              </button>
              <button
                onClick={() => setTab("matchs")}
                className={`relative flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  tab === "matchs"
                    ? "gold-gradient text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Sparkles className="h-4 w-4" /> Matchs
                {matches.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {matches.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 pb-24">
            {tab === "hub" ? (
              <SocialFeed activeCategory={category} onCategoryChange={setCategory} />
            ) : tab === "rencontres" ? (
              <DatingGrid onConnectClick={() => setGoldOpen(true)} />
            ) : (
              <DatingMatches matches={matches} isPremium={isPremium} onGoldClick={() => setGoldOpen(true)} />
            )}
          </div>
        </VerifiedGate>
      </main>

      <SecuritySovereign />
      <AmalTrigger />
      <GoldModal open={goldOpen} onClose={() => setGoldOpen(false)} />
      <MobileBottomNav />
    </div>
  );
};

export default HubSocial;
