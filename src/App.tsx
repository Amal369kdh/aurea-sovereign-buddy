import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import MonDossier from "./pages/MonDossier";
import HubSocial from "./pages/HubSocial";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Legal from "./pages/Legal";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

/**
 * Handles Supabase email confirmation links that land anywhere with
 * ?token_hash=...&type=... or the older #access_token=... fragment.
 * Exchanges the token/session then waits for the auth state change before
 * redirecting — avoids the race condition that caused the infinite loader.
 */
/** Detect mobile/tablet UA — used to show a manual redirect screen instead of
 *  relying on React Router navigate() which can silently fail on iOS/Android
 *  WebViews before the Supabase session is fully hydrated.
 */
const isMobileDevice = () =>
  typeof window !== "undefined" &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const EmailConfirmHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [city, setCity] = useState<string>("ta ville");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as "signup" | "recovery" | "email_change" | null;

    // Also handle hash-based legacy tokens (#access_token=...)
    const hash = new URLSearchParams(location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    const hasToken = (tokenHash && type) || (accessToken && refreshToken);
    if (!hasToken) return;

    setProcessing(true);

    // Subscribe BEFORE exchanging the token so we catch the SIGNED_IN event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        subscription.unsubscribe();

        if (isMobileDevice()) {
          // On mobile: fetch city then show the manual confirmation screen
          // instead of navigate() which can fail on WebViews
          if (session?.user?.id) {
            supabase
              .from("profiles")
              .select("city")
              .eq("user_id", session.user.id)
              .maybeSingle()
              .then(({ data }) => {
                if (data?.city) setCity(data.city);
                setProcessing(false);
                setConfirmed(true);
              });
          } else {
            setProcessing(false);
            setConfirmed(true);
          }
        } else {
          // On desktop: navigate works reliably
          setTimeout(() => navigate("/", { replace: true }), 100);
        }
      }
    });

    const exchange = tokenHash && type
      ? supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });

    exchange.then(({ error }) => {
      if (error) {
        subscription.unsubscribe();
        setProcessing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mobile confirmation screen — shown after successful token exchange
  if (confirmed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl gold-gradient">
          <span className="text-2xl">✨</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">
            Ton email est confirmé !
          </h1>
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-primary">{city}</span> t'attend — on est là à chaque étape 🎓
          </p>
        </div>
        <button
          onClick={() => { window.location.href = "/"; }}
          className="flex items-center gap-2 rounded-2xl gold-gradient px-8 py-4 text-base font-bold text-primary-foreground shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          Accéder à mon espace →
        </button>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  // Track which user we last checked so navigations don't re-trigger the loader
  const checkedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      checkedUserRef.current = null;
      setProfileChecked(true);
      setNeedsOnboarding(false);
      return;
    }

    // Same user, same result — no need to re-check (avoids flash on navigation)
    if (checkedUserRef.current === user.id && profileChecked) return;

    setProfileChecked(false);
    setNeedsOnboarding(false);
    checkedUserRef.current = user.id;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const checkProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nationality, city, university, objectifs, is_in_france, onboarding_step")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!data && attempts < maxAttempts) {
        attempts++;
        setTimeout(checkProfile, 500 * attempts);
        return;
      }

      if (!data) {
        setNeedsOnboarding(true);
        setProfileChecked(true);
        return;
      }

      const isFrench = data.nationality === "🇫🇷 Française";
      const objectifs = data.objectifs as string[] | null;
      const incomplete =
        !data.nationality ||
        !data.city ||
        !data.university ||
        !objectifs ||
        objectifs.length === 0 ||
        (!isFrench && data.is_in_france === null);

      setNeedsOnboarding(incomplete);
      setProfileChecked(true);
    };

    checkProfile();
    return () => { cancelled = true; };
  }, [user?.id]);  // Only re-run when user ID changes, not on every navigation

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
          <ErrorBoundary>
          <BrowserRouter>
            <EmailConfirmHandler />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/mon-dossier" element={<ProtectedRoute><MonDossier /></ProtectedRoute>} />
              <Route path="/hub-social" element={<ProtectedRoute><HubSocial /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/legal" element={<Legal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </ErrorBoundary>
        </IntegrationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
