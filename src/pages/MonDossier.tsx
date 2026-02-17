import DashboardHeader from "@/components/DashboardHeader";
import PhaseChecklist from "@/components/PhaseChecklist";
import AlphaVault from "@/components/AlphaVault";
import AyaTrigger from "@/components/AyaTrigger";
import AppSidebar from "@/components/AppSidebar";

const MonDossier = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />
        <div className="px-6 pb-24">
          <PhaseChecklist />
          <AlphaVault />
        </div>
      </main>
      <AyaTrigger />
    </div>
  );
};

export default MonDossier;
