import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import MonDossier from "./pages/MonDossier";
import HubSocial from "./pages/HubSocial";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user) { setProfileChecked(true); return; }
    supabase
      .from("profiles")
      .select("nationality, city, university, objectifs, is_in_france, onboarding_step")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const d = data as any;
        const isFrench = d?.nationality === "🇫🇷 Française";
        const incomplete = !d?.nationality || !d?.city || !d?.university || !d?.objectifs || (d.objectifs as string[]).length === 0 || (!isFrench && (d?.is_in_france === null || d?.is_in_france === undefined));
        setNeedsOnboarding(incomplete);
        setProfileChecked(true);
      });
  }, [user]);

  if (loading || !profileChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <IntegrationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/mon-dossier" element={<ProtectedRoute><MonDossier /></ProtectedRoute>} />
              <Route path="/hub-social" element={<ProtectedRoute><HubSocial /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </IntegrationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
