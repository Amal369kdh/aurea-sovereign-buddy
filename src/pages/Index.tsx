import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/DashboardHeader";
import SovereigntyWidget from "@/components/SovereigntyWidget";
import BentoGrid from "@/components/BentoGrid";
import SocialPulse from "@/components/SocialPulse";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import WelcomeGuide from "@/components/WelcomeGuide";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const WelcomeModal = ({ onClose }: { onClose: () => void }) => {
  const handleEnter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ has_seen_welcome: true }).eq("user_id", user.id);
    }
    onClose();
  };

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
          <h1
            className="mb-5 text-2xl font-semibold tracking-tight"
            style={{ color: "hsl(43 74% 58%)" }}
          >
            Bienvenue à l'intérieur.
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            Aurea est un espace créé par des étudiants, pour les étudiants. Ici, nous cultivons l'entraide et la responsabilité, sans distinction d'origine, de nationalité ou de niveau social. Nous sommes la relève de demain. Ensemble, bâtissons notre souveraineté, sans peur et avec amour. Tu es à ta place.
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
            Entrer dans mon espace
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Index = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("has_seen_welcome")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.has_seen_welcome === false) {
          setShowWelcome(true);
        }
      });
  }, [user?.id]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />

        <div className="px-6 pb-28">
          <div className="mb-6">
            <WelcomeGuide />
          </div>
          <div className="mb-6">
            <SovereigntyWidget />
          </div>
          <BentoGrid />
          <div className="mt-6">
            <SocialPulse />
          </div>
        </div>
      </main>

      <SecuritySovereign />
      <AmalTrigger />
      <MobileBottomNav />

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </div>
  );
};

export default Index;
