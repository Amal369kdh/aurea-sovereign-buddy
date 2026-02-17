import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AyaTrigger from "@/components/AyaTrigger";
import SocialFeed from "@/components/SocialFeed";
import DatingGrid from "@/components/DatingGrid";
import GoldModal from "@/components/GoldModal";
import { Users, Heart } from "lucide-react";

type Tab = "hub" | "rencontres";

const HubSocial = () => {
  const [tab, setTab] = useState<Tab>("hub");
  const [category, setCategory] = useState<"all" | "entraide" | "sorties" | "logement">("all");
  const [goldOpen, setGoldOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-2xl font-extrabold text-foreground">Hub Social</h1>
          <p className="text-sm text-muted-foreground">Connecte-toi avec les étudiants de ta ville</p>

          {/* Hub / Rencontres toggle */}
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
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 pb-24">
          {tab === "hub" ? (
            <SocialFeed activeCategory={category} onCategoryChange={setCategory} />
          ) : (
            <DatingGrid onConnectClick={() => setGoldOpen(true)} />
          )}
        </div>
      </main>

      <AyaTrigger />
      <GoldModal open={goldOpen} onClose={() => setGoldOpen(false)} />
    </div>
  );
};

export default HubSocial;
