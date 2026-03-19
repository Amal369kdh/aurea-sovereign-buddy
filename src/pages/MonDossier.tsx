import DashboardHeader from "@/components/DashboardHeader";
import PhaseChecklist from "@/components/PhaseChecklist";
import AlphaVault from "@/components/AlphaVault";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import VerifiedGate from "@/components/VerifiedGate";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const MonDossier = () => {
  const { flags } = useFeatureFlags();
  const dossierEnabled = flags["mon_dossier"] !== false;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />
        <div className="px-6 pb-28">
          {dossierEnabled ? (
            <>
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
