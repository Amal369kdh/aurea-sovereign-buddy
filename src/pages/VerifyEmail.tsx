import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

type State = "loading" | "success" | "already_done" | "invalid" | "expired" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam === "missing_token" || !token) {
      setState("invalid");
      return;
    }

    let cancelled = false;

    const confirm = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-student-email", {
          method: "POST",
          body: { token },
        });

        if (cancelled) return;

        if (error) {
          setState("error");
          return;
        }

        if (data?.error === "invalid_token") {
          setState("invalid");
        } else if (data?.error === "expired_token") {
          setState("expired");
        } else if (data?.success && data?.already_verified) {
          setState("already_done");
          if (data.student_email) setStudentEmail(data.student_email);
        } else if (data?.success) {
          setState("success");
          if (data.student_email) setStudentEmail(data.student_email);
          // Signal other open tabs that verification is complete
          try {
            localStorage.setItem("aurea_student_verified", data.user_id);
            setTimeout(() => localStorage.removeItem("aurea_student_verified"), 5000);
          } catch (_) { /* ignore */ }
        } else {
          setState("error");
        }
      } catch (_) {
        if (!cancelled) setState("error");
      }
    };

    confirm();
    return () => { cancelled = true; };
  }, []);

  const goToApp = () => { window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-6"
      >
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Vérification en cours…</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl gold-gradient shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-foreground">Email vérifié ✅</h1>
              {studentEmail && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{studentEmail}</span> est maintenant lié à ton compte.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Tu es désormais <span className="font-semibold text-primary">Témoin</span> — toutes les fonctionnalités sont débloquées 🎓
              </p>
            </div>
            <button
              onClick={goToApp}
              className="w-full rounded-2xl gold-gradient py-4 text-base font-bold text-primary-foreground shadow-lg active:scale-95 transition-transform cursor-pointer"
            >
              Accéder à mon espace →
            </button>
          </>
        )}

        {state === "already_done" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-foreground">Déjà vérifié</h1>
              <p className="text-sm text-muted-foreground">Ton email étudiant a déjà été confirmé. Tu peux accéder à l'application.</p>
            </div>
            <button onClick={goToApp} className="w-full rounded-2xl gold-gradient py-4 text-base font-bold text-primary-foreground cursor-pointer">
              Accéder à mon espace →
            </button>
          </>
        )}

        {state === "expired" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
              <Clock className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-foreground">Lien expiré</h1>
              <p className="text-sm text-muted-foreground">Ce lien a expiré (valable 24h). Connecte-toi et demande un nouveau lien depuis ton profil.</p>
            </div>
            <button onClick={goToApp} className="w-full rounded-2xl border border-border bg-card py-4 text-base font-bold text-foreground cursor-pointer">
              Retourner sur l'application
            </button>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-foreground">
                {state === "invalid" ? "Lien invalide" : "Erreur inattendue"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {state === "invalid"
                  ? "Ce lien de vérification n'existe pas ou a déjà été utilisé."
                  : "Une erreur s'est produite. Réessaie ou contacte le support."}
              </p>
            </div>
            <button onClick={goToApp} className="w-full rounded-2xl border border-border bg-card py-4 text-base font-bold text-foreground cursor-pointer">
              Retourner sur l'application
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
