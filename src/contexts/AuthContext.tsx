import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  useEffect(() => {
    // Hard safety timeout: if auth never resolves (offline/slow network), unblock UI after 6s
    const authTimeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn("[AuthContext] Auth load timed out after 6s — unblocking UI");
          return false;
        }
        return prev;
      });
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(authTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Si un autre onglet supprime le compte ou se déconnecte via Supabase Auth,
      // cet event SIGNED_OUT sera émis dans TOUS les onglets automatiquement.
      if (event === "SIGNED_OUT" && !session) {
        const hasSupabaseSession = Object.keys(localStorage).some(
          (k) => k.startsWith("sb-") || k.toLowerCase().includes("supabase")
        );
        if (
          !window.location.pathname.startsWith("/auth") &&
          !window.location.pathname.startsWith("/reset-password") &&
          hasSupabaseSession
        ) {
          window.location.href = "/auth";
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(authTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // Network error: unblock immediately
      clearTimeout(authTimeout);
      setLoading(false);
    });

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
      clearTimeout(authTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string): Promise<{ error: string | null; data: any }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        // Toujours pointer vers le domaine de production pour éviter
        // les redirections vers l'URL interne de Lovable
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
    await supabase.auth.signOut();
    // Force full page reload for mobile Chrome reliability (React Router navigate can fail)
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
