import DashboardHeader from "@/components/DashboardHeader";
import PhaseChecklist from "@/components/PhaseChecklist";
import AlphaVault from "@/components/AlphaVault";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useIntegration } from "@/contexts/IntegrationContext";
import { MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const MonDossier = () => {
  const { flags } = useFeatureFlags();
  const { isInFrance, setIsInFrance } = useIntegration();
  const dossierEnabled = flags["mon_dossier"] !== false;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />
        <div className="px-6 pb-28">
          {dossierEnabled ? (
            <>
              {/* Bannière contextuelle si l'utilisateur n'a pas indiqué être en France */}
              {(isInFrance === null || isInFrance === false) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-3xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gold-gradient">
                    <MapPin className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {isInFrance === false
                        ? "Tu es maintenant en France ? Débloque tes démarches 🇫🇷"
                        : "Indique si tu es en France pour débloquer les démarches 🇫🇷"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Les sections Logement, Sécu, CAF et plus se débloquent automatiquement une fois que tu confirmes ton arrivée.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInFrance(true)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl gold-gradient px-3 py-2 text-xs font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Je suis en France
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
              <PhaseChecklist />
              <AlphaVault />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
              <span className="text-4xl">🔒</span>
              <p className="text-lg font-bold text-foreground">Mon Dossier temporairement désactivé</p>
              <p className="text-sm text-muted-foreground">Cette section est momentanément indisponible. Revenez bientôt.</p>
            </div>
          )}
        </div>
      </main>
      <SecuritySovereign />
      <AmalTrigger />
      <MobileBottomNav />
    </div>
  );
};

export default MonDossier;
