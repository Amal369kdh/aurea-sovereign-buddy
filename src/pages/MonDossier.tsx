import DashboardHeader from "@/components/DashboardHeader";
import PhaseChecklist from "@/components/PhaseChecklist";
import AlphaVault from "@/components/AlphaVault";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

const MonDossier = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />
        <div className="px-6 pb-28">
          <PhaseChecklist />
          <AlphaVault />
        </div>
      </main>
      <SecuritySovereign />
      <AmalTrigger />
      <MobileBottomNav />
    </div>
  );
};

export default MonDossier;
