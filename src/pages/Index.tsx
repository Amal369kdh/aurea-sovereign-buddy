import DashboardHeader from "@/components/DashboardHeader";
import SovereigntyWidget from "@/components/SovereigntyWidget";
import DailyRoadmap from "@/components/DailyRoadmap";
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
          <div className="grid gap-6 lg:grid-cols-2">
            <SovereigntyWidget />
            <DailyRoadmap />
          </div>

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
