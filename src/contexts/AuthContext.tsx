import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether the initial session has been restored from storage
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // ── STEP 1: Set up the listener FIRST (recommended pattern per Supabase docs)
    // This ensures we never miss an auth event that fires before getSession resolves.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Only mark loading as done once the initial session restore is complete.
      // Subsequent events (SIGNED_IN, TOKEN_REFRESHED, etc.) must not re-trigger
      // the loading state after the initial load.
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }

      // Cross-tab sign-out: redirect to /auth when another tab signs out.
      if (event === "SIGNED_OUT" && !session) {
        const isPublicPage =
          window.location.pathname.startsWith("/auth") ||
          window.location.pathname.startsWith("/reset-password") ||
          window.location.pathname.startsWith("/apercu") ||
          window.location.pathname.startsWith("/legal");
        if (!isPublicPage) {
          window.location.replace("/auth");
        }
      }
    });

    // ── STEP 2: Restore session from storage (fires INITIAL_SESSION event → handled above)
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If onAuthStateChange already fired with INITIAL_SESSION, this is a no-op.
      // If it hasn't fired yet (slow init), we set state here as a safety net.
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch(() => {
      // Network error on session restore: unblock UI
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    });

    // ── STEP 3: Hard timeout — never block the UI forever (e.g. offline/slow mobile)
    const hardTimeout = setTimeout(() => {
      if (!initialLoadDone.current) {
        console.warn("[AuthContext] Auth init timed out after 8s — unblocking UI");
        initialLoadDone.current = true;
        setLoading(false);
      }
    }, 8000);

    // ── STEP 4: Cross-tab session sync (e.g. sign-in in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes("supabase") && e.newValue !== null) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session);
            setUser(session.user);
            setLoading(false);
          }
        });
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      clearTimeout(hardTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string): Promise<{ error: string | null; data: any }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: "https://aurea-student.fr",
      },
    });
    return { error: error?.message ?? null, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out errors
    }
    setTimeout(() => {
      window.location.replace("/auth");
    }, 50);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
