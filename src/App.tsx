import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import Partners from "./pages/Partners";
import NotFound from "./pages/NotFound";
import Legal from "./pages/Legal";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Apercu from "./pages/Apercu";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();


const EmailConfirmHandler = () => {
  const location = useLocation();
  const [processing, setProcessing] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);
  const [city, setCity] = useState<string>("ta ville");
  // Guard: never process twice (React StrictMode double-invocation)
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as "signup" | "recovery" | "email_change" | null;
    const hash = new URLSearchParams(location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    // Clean the token from the URL immediately so refresh doesn't re-trigger
    window.history.replaceState({}, "", window.location.pathname);

    const doExchange = async () => {
      try {
        let exchangeError: Error | null = null;
        let userId: string | null = null;

        if (tokenHash && type) {
          const { data, error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          exchangeError = err;
          userId = data?.user?.id ?? null;
        } else if (accessToken && refreshToken) {
          const { data, error: err } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          exchangeError = err;
          userId = data?.user?.id ?? null;
        }

        if (exchangeError) {
          console.error("[EmailConfirmHandler] Exchange error:", exchangeError.message);
          setError(true);
          setProcessing(false);
          return;
        }

        // Fetch city for the success message
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("city")
            .eq("user_id", userId)
            .maybeSingle();
          if (profile?.city) setCity(profile.city);
        }

        setProcessing(false);
        setConfirmed(true);
      } catch (e) {
        console.error("[EmailConfirmHandler] Unexpected error:", e);
        setError(true);
        setProcessing(false);
      }
    };

    doExchange();
  }, []);

  if (processing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="space-y-3 max-w-sm">
          <h1 className="text-xl font-bold text-foreground">Lien expiré ou invalide</h1>
          <p className="text-sm text-muted-foreground">
            Ce lien de confirmation a expiré ou a déjà été utilisé. Reconnecte-toi ou demande un nouvel email.
          </p>
        </div>
        <button
          onClick={() => { window.location.replace("/auth"); }}
          className="rounded-2xl gold-gradient px-8 py-3 text-sm font-bold text-primary-foreground"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
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
          onClick={() => { window.location.href = "/onboarding"; }}
          className="flex items-center gap-2 rounded-2xl gold-gradient px-8 py-4 text-base font-bold text-primary-foreground shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          Commencer l'inscription →
        </button>
      </div>
    );
  }

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  // Track the user ID we last ran the check for — avoid duplicate runs
  const checkedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      checkedUserRef.current = null;
      setProfileChecked(true);
      setNeedsOnboarding(false);
      return;
    }

    // Same user already resolved in this session — skip
    if (checkedUserRef.current === user.id && profileChecked) return;

    setProfileChecked(false);
    setNeedsOnboarding(false);
    checkedUserRef.current = user.id;

    let cancelled = false;
    let attempts = 0;
    // After 10 attempts (~12s total) we send to onboarding if still no profile
    const maxAttempts = 10;

    // Hard safety timeout: 20s — never block forever on mobile
    const hardTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("[ProtectedRoute] Hard timeout — sending to onboarding");
        setNeedsOnboarding(true);
        setProfileChecked(true);
      }
    }, 20000);

    const checkProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("nationality, city, university, objectifs, is_in_france")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        // Any RLS/network error → let user through to avoid permanent lockout
        if (error) {
          console.warn("[ProtectedRoute] Profile query error:", error.message);
          clearTimeout(hardTimeout);
          setNeedsOnboarding(false);
          setProfileChecked(true);
          return;
        }

        // Profile not yet created by the DB trigger → retry with backoff
        if (!data) {
          if (attempts < maxAttempts) {
            attempts++;
            // Backoff: 800ms, 800ms, 1.2s, 1.2s, 1.5s, 1.5s, 2s…
            const delay = attempts <= 2 ? 800 : attempts <= 4 ? 1200 : attempts <= 6 ? 1500 : 2000;
            setTimeout(checkProfile, delay);
            return;
          }
          // Still no profile after max retries → onboarding will create it
          clearTimeout(hardTimeout);
          setNeedsOnboarding(true);
          setProfileChecked(true);
          return;
        }

        // Profile exists — check if onboarding was completed
        const isFrench = data.nationality === "🇫🇷 Française";
        const objectifs = data.objectifs as string[] | null;

        const incomplete =
          !data.nationality ||
          !data.university ||
          !objectifs ||
          objectifs.length === 0 ||
          (!isFrench && data.is_in_france === null);

        clearTimeout(hardTimeout);
        setNeedsOnboarding(incomplete);
        setProfileChecked(true);
      } catch {
        // Network error → let through
        if (!cancelled) {
          clearTimeout(hardTimeout);
          setNeedsOnboarding(false);
          setProfileChecked(true);
        }
      }
    };

    checkProfile();
    return () => {
      cancelled = true;
      clearTimeout(hardTimeout);
    };
  }, [user?.id]);

  // Show spinner while auth or profile check is pending
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

/**
 * AppRouter détecte la présence d'un token de confirmation Supabase
 * (token_hash + type OU access_token dans le hash) DÈS le premier render,
 * avant que les Routes ne se montent.
 * Si un token est présent → on affiche UNIQUEMENT EmailConfirmHandler,
 * ce qui empêche tout overlap entre la page d'auth et le dashboard.
 * Si pas de token → rendu normal des Routes.
 */
const AppRouter = () => {
  const loc = window.location;
  const params = new URLSearchParams(loc.search);
  const hash = new URLSearchParams(loc.hash.slice(1));

  const hasConfirmToken =
    // token Supabase dans les query params (signup, email_change…)
    (!!params.get("token_hash") && !!params.get("type") && params.get("type") !== "recovery") ||
    // token dans le hash (ancien format)
    (!!hash.get("access_token") && !!hash.get("refresh_token") && hash.get("type") !== "recovery");

  if (hasConfirmToken) {
    // Aucune route ne se monte — EmailConfirmHandler gère tout
    return <EmailConfirmHandler />;
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/apercu" element={<Apercu />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/mon-dossier" element={<ProtectedRoute><MonDossier /></ProtectedRoute>} />
        <Route path="/hub-social" element={<ProtectedRoute><HubSocial /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
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
              <AppRouter />
              <PWAInstallPrompt />
            </BrowserRouter>
          </ErrorBoundary>
        </IntegrationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
