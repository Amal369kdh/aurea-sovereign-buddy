import DashboardHeader from "@/components/DashboardHeader";
import SovereigntyWidget from "@/components/SovereigntyWidget";
import BentoGrid from "@/components/BentoGrid";
import SocialPulse from "@/components/SocialPulse";
import AyaTrigger from "@/components/AyaTrigger";
import AppSidebar from "@/components/AppSidebar";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />

        <div className="px-6 pb-24">
          {/* Sovereignty ring — compact at top */}
          <div className="mb-6">
            <SovereigntyWidget />
          </div>

          {/* Bento tiles */}
          <BentoGrid />

          {/* Social pulse */}
          <div className="mt-6">
            <SocialPulse />
          </div>
        </div>
      </main>

      <AyaTrigger />
    </div>
  );
};

export default Index;
