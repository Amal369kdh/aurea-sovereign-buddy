import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/contexts/IntegrationContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface VerifiedGateProps {
  children: React.ReactNode;
  featureName?: string;
}

type GateState = "idle" | "input" | "sending" | "sent" | "error";

const EMAIL_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2}$/i,
  /\.univ-[a-z-]+\.fr$/i,
  /\.u-[a-z-]+\.fr$/i,
  /\.etu\.[a-z-]+\.fr$/i,
  /\.etud\.[a-z-]+\.fr$/i,
  /\.univ\.fr$/i,
  /\.ac-[a-z-]+\.fr$/i,
  /\.ens[a-z]*\.fr$/i,
  /\.insa[a-z-]*\.fr$/i,
  /\.iut[a-z-]*\.fr$/i,
  /\.grenoble-inp\.fr$/i,
  /\.parisnanterre\.fr$/i,
  /\.sorbonne-universite\.fr$/i,
  /\.universite-paris-saclay\.fr$/i,
  /\.umontpellier\.fr$/i,
  /\.univ-grenoble-alpes\.fr$/i,
  /\.uga\.fr$/i,
];

function isAcademicEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return EMAIL_PATTERNS.some((p) => p.test(domain));
}

// TEST_MODE: When true, accept email format without actual verification email
const TEST_MODE = false;

const VerifiedGate = ({ children, featureName = "cette fonctionnalité" }: VerifiedGateProps) => {
  const { user } = useAuth();
  const { refreshProfile } = useIntegration();
  const { toast } = useToast();
  const [status, setStatus] = useState<string | null>(null);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateState, setGateState] = useState<GateState>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("status, suspended_until")
      .eq("user_id", uid)
      .maybeSingle();
    const profileData = data as { status: string; suspended_until: string | null } | null;
    setStatus(profileData?.status ?? "explorateur");
    setSuspendedUntil(profileData?.suspended_until ?? null);
    setLoading(false);
    return profileData?.status ?? "explorateur";
  };

  // Start polling after sending verification email — catches same-tab confirmation
  const startPolling = (uid: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    const maxAttempts = 40; // 40 × 3s = 2 min
    pollingRef.current = setInterval(async () => {
      attempts++;
      const st = await loadProfile(uid);
      if (st === "temoin" || st === "admin" || attempts >= maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (st === "temoin" || st === "admin") {
          refreshProfile();
          toast({
            title: "Email vérifié ✅",
            description: "T'es prêt(e) ! Toutes les fonctionnalités sont débloquées.",
          });
        }
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    loadProfile(user.id);

    // Realtime subscription: detect when is_verified/status changes (e.g. after clicking confirmation link)
    const ch = supabase
      .channel(`profile-verify-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRow = payload.new as { status: string; suspended_until: string | null; is_verified: boolean };
          if (newRow.status === "temoin" || newRow.is_verified) {
            setStatus("temoin");
            setSuspendedUntil(newRow.suspended_until);
            refreshProfile();
            toast({
              title: "Email vérifié ✅",
              description: "Ton statut est maintenant Témoin. Toutes les fonctionnalités sont débloquées !",
            });
          }
        }
      )
      .subscribe();
    channelRef.current = ch;

    // Cross-tab sync: detect verification done in another tab/window
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "aurea_student_verified" && e.newValue === user.id) {
        loadProfile(user.id).then(() => refreshProfile());
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      ch.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      stopPolling();
    };
  }, [user?.id]);

  if (loading) return null;

  if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
    const formattedDate = new Date(suspendedUntil).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10">
            <ShieldCheck className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Compte suspendu</h2>
          <p className="text-sm text-muted-foreground">
            Ton compte est suspendu jusqu'au{" "}
            <span className="font-semibold text-foreground">{formattedDate}</span>.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground cursor-pointer"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (status === "temoin" || status === "admin") return <>{children}</>;

  const clientValid = email.includes("@") && isAcademicEmail(email);

  const handleSubmit = async () => {
    if (!clientValid) {
      setErrorMsg("Cet email ne correspond pas à un domaine universitaire reconnu.");
      return;
    }
    setGateState("sending");
    setErrorMsg("");

    try {
      if (TEST_MODE) {
        // TEST MODE: Directly update status to temoin without sending email
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ status: "temoin", is_verified: true })
          .eq("user_id", user!.id);

        if (updateError) {
          setGateState("error");
          setErrorMsg("Erreur lors de la mise à jour du profil.");
          return;
        }

        await refreshProfile();
        setStatus("temoin");
        toast({
          title: "Email vérifié ✅",
          description: "Ton statut est maintenant Témoin. Toutes les sections sont débloquées !",
        });
        return;
      }

      // PRODUCTION MODE: Send verification email via edge function
      const { data, error } = await supabase.functions.invoke("verify-student-email", {
        body: { student_email: email.trim().toLowerCase() },
      });

      if (error) {
        setGateState("error");
        setErrorMsg("Erreur réseau. Réessaie.");
        return;
      }

      if (data?.error) {
        setGateState("error");
        if (data.error === "invalid_domain") {
          setErrorMsg(data.message || "Domaine non reconnu.");
        } else if (data.error === "rate_limit") {
          setErrorMsg(data.message || "Trop de tentatives.");
        } else if (data.error === "email_taken") {
          setErrorMsg(data.message || "Email déjà utilisé.");
        } else {
          setErrorMsg(data.message || "Erreur inconnue.");
        }
        return;
      }

      setGateState("sent");
      toast({
        title: data?.email_sent ? "Email envoyé ✅" : "Lien généré ✅",
        description: data?.email_sent
          ? `Vérifie ta boîte mail ${email.trim().toLowerCase()}`
          : "Clique sur le lien pour confirmer ton email étudiant.",
      });
    } catch {
      setGateState("error");
      setErrorMsg("Erreur inattendue. Réessaie.");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-2">
          Accès réservé aux étudiants vérifiés
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Pour accéder à <span className="font-semibold text-foreground">{featureName}</span>,
          vérifie ton identité avec un email universitaire (.edu, .univ.fr, etc.).
        </p>

        <AnimatePresence mode="wait">
          {(gateState === "idle" || gateState === "input" || gateState === "error") && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-border bg-card p-5 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Comment ça marche ?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entre ton adresse email universitaire. {TEST_MODE
                        ? "Ton statut sera mis à jour automatiquement si le format est valide."
                        : "Clique sur le lien de confirmation que tu recevras. Ton statut passera automatiquement à « Témoin » ✅"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pourquoi cette vérification ?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      La sécurité de la communauté est notre priorité.
                      Seuls les étudiants vérifiés peuvent accéder au Hub Social,
                      aux Rencontres et à la messagerie privée.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="prenom.nom@univ-grenoble-alpes.fr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                    if (gateState === "error") setGateState("input");
                    if (gateState === "idle") setGateState("input");
                  }}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-destructive"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}
              </div>

              <button
                disabled={!clientValid}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Vérifier mon email étudiant <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {gateState === "sending" && (
            <motion.div
              key="sending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-8"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Vérification en cours…</p>
            </motion.div>
          )}

          {gateState === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                <p className="text-sm font-bold text-foreground">Email envoyé ! 📬</p>
                <p className="text-xs text-muted-foreground">
                  Un email de confirmation a été envoyé à {email.trim().toLowerCase()}. Vérifie ta boîte de réception (et tes spams) puis clique sur le lien. Recharge ensuite la page.
                </p>
              </div>
              <button
                onClick={() => {
                  setGateState("idle");
                  setEmail("");
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer"
              >
                Utiliser un autre email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VerifiedGate;
