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
import Partners from "./pages/Partners";
import NotFound from "./pages/NotFound";
import Legal from "./pages/Legal";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Apercu from "./pages/Apercu";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

/** Detect mobile/tablet UA */
const isMobileDevice = () =>
  typeof window !== "undefined" &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/**
 * Handles Supabase email confirmation links (?token_hash= or #access_token=).
 * Only runs when there is actually a token in the URL — never loops.
 * On mobile shows a manual "Accéder à mon espace" screen to avoid WebView navigate() failures.
 */
/**
 * Handles Supabase email confirmation links (?token_hash= or #access_token=).
 * Only runs when there is actually a token in the URL — never loops.
 * Renders a FULL-SCREEN overlay (z-50) to prevent the underlying route from
 * showing through during processing and on the success/confirmation screen.
 * On mobile shows a manual "Accéder à mon espace" screen to avoid WebView navigate() failures.
 */
const EmailConfirmHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [city, setCity] = useState<string>("ta ville");
  // Guard: never process twice (React strict mode / remounts)
  const handled = useRef(false);
  // Whether this component should render at all (token present)
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as "signup" | "recovery" | "email_change" | null;

    const hash = new URLSearchParams(location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const hashType = hash.get("type");

    // ⚠️ CRITICAL: Never handle recovery tokens here — /reset-password handles them exclusively.
    if (type === "recovery" || hashType === "recovery") return;

    const tokenPresent = !!(tokenHash && type) || !!(accessToken && refreshToken);
    // If there is no token in the URL we do NOTHING
    if (!tokenPresent) return;
    setHasToken(true);
    if (handled.current) return;
    handled.current = true;

    setProcessing(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        subscription.unsubscribe();
        // Clean the token from the URL so refresh doesn't re-trigger
        window.history.replaceState({}, "", window.location.pathname);

        if (isMobileDevice()) {
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
          // Desktop: redirect directly, don't show confirmed screen
          setTimeout(() => navigate("/", { replace: true }), 100);
        }
      }
    });

    const exchange = (tokenHash && type)
      ? supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });

    exchange.then(({ error }) => {
      if (error) {
        subscription.unsubscribe();
        setProcessing(false);
        setHasToken(false);
        // En cas d'erreur (lien expiré), on nettoie l'URL et on revient à /auth
        window.history.replaceState({}, "", "/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't render anything if there's no token — avoids overlapping with underlying route
  if (!hasToken && !processing && !confirmed) return null;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
