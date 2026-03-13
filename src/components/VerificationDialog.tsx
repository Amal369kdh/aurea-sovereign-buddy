import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/contexts/IntegrationContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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

// Match TEST_MODE from VerifiedGate
const TEST_MODE = false;

type GateState = "idle" | "input" | "sending" | "sent" | "error";

interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
}

const VerificationDialog = ({ open, onClose }: VerificationDialogProps) => {
  const { user } = useAuth();
  const { refreshProfile } = useIntegration();
  const { toast } = useToast();
  const [gateState, setGateState] = useState<GateState>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
        toast({
          title: "Email vérifié ✅",
          description: "Ton statut est maintenant Témoin. Toutes les sections sont débloquées !",
        });
        onClose();
        return;
      }

      // PRODUCTION MODE
      const { data, error } = await supabase.functions.invoke("verify-student-email", {
        body: { student_email: email.trim().toLowerCase() },
      });

      // Le SDK Supabase JS place les réponses HTTP 4xx/5xx dans `error` (FunctionsHttpError),
      // pas dans `data`. On extrait le body JSON pour récupérer le vrai message.
      if (error) {
        let errBody: { error?: string; message?: string } = {};
        try {
          errBody = await (error as { context?: Response }).context?.json?.() ?? {};
        } catch {
          // si le parsing échoue, on tombe sur le message générique
        }
        setGateState("error");
        if (errBody.error === "invalid_domain") setErrorMsg(errBody.message || "Domaine non reconnu.");
        else if (errBody.error === "rate_limit") setErrorMsg(errBody.message || "Trop de tentatives. Réessaie dans 24h.");
        else if (errBody.error === "email_taken") setErrorMsg(errBody.message || "Email déjà utilisé par un autre compte.");
        else if (errBody.message) setErrorMsg(errBody.message);
        else setErrorMsg("Erreur réseau. Réessaie.");
        return;
      }

      if (data?.error) {
        setGateState("error");
        if (data.error === "invalid_domain") setErrorMsg(data.message || "Domaine non reconnu.");
        else if (data.error === "rate_limit") setErrorMsg(data.message || "Trop de tentatives.");
        else if (data.error === "email_taken") setErrorMsg(data.message || "Email déjà utilisé.");
        else setErrorMsg(data.message || "Erreur inconnue.");
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle className="sr-only">Vérification email étudiant</DialogTitle>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-extrabold text-foreground mb-1">
            Vérifie ton email étudiant
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Un email universitaire (.edu, .univ.fr, etc.) est nécessaire pour débloquer toutes les fonctionnalités.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {(gateState === "idle" || gateState === "input" || gateState === "error") && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Comment ça marche ?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {TEST_MODE
                        ? "Ton statut sera mis à jour automatiquement si le format est valide."
                        : "Clique sur le lien de confirmation que tu recevras. Ton statut passera à « Témoin » ✅"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Que débloque la vérification ?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hub Social, Rencontres, messagerie privée, et toutes les démarches post-arrivée (CAF, Sécu, logement…).
                    </p>
                  </div>
                </div>
              </div>

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
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-destructive">
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
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Vérification en cours…</p>
            </motion.div>
          )}

          {gateState === "sent" && (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                <p className="text-sm font-bold text-foreground">Email envoyé ! 📬</p>
                <p className="text-xs text-muted-foreground">
                  Un email de confirmation a été envoyé à {email.trim().toLowerCase()}. Vérifie ta boîte de réception (et tes spams) puis clique sur le lien.
                </p>
              </div>
              <button
                onClick={() => { setGateState("idle"); setEmail(""); }}
                className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer"
              >
                Utiliser un autre email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
