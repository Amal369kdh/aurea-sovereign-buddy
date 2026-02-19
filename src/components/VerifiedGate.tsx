import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

const VerifiedGate = ({ children, featureName = "cette fonctionnalité" }: VerifiedGateProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateState, setGateState] = useState<GateState>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const profileData = data as { status: string } | null;
        setStatus(profileData?.status ?? "explorateur");
        setLoading(false);
      });
  }, [user]);

  if (loading) return null;
  if (status === "temoin") return <>{children}</>;

  const clientValid = email.includes("@") && isAcademicEmail(email);

  const handleSubmit = async () => {
    if (!clientValid) {
      setErrorMsg("Cet email ne correspond pas à un domaine universitaire reconnu.");
      return;
    }
    setGateState("sending");
    setErrorMsg("");

    try {
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

      setConfirmUrl(data?.confirm_url || null);
      setGateState("sent");
      toast({
        title: "Lien généré ✅",
        description: "Clique sur le lien pour confirmer ton email étudiant.",
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
                      Entre ton adresse email universitaire et clique sur le lien de confirmation
                      que tu recevras. Ton statut passera automatiquement à « Témoin » ✅
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

          {gateState === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                <p className="text-sm font-bold text-foreground">Lien de vérification généré !</p>
                <p className="text-xs text-muted-foreground">
                  Clique sur le bouton ci-dessous pour confirmer ton email étudiant.
                  Une fois confirmé, recharge la page pour accéder à toutes les fonctionnalités.
                </p>
                {confirmUrl && (
                  <a
                    href={confirmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl gold-gradient px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Confirmer mon email <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
              <button
                onClick={() => {
                  setGateState("idle");
                  setEmail("");
                  setConfirmUrl(null);
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
