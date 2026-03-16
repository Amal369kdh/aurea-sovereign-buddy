import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { KeyRound, Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState("");
  // Guard: consume the token only ONCE (React StrictMode double-invoke fix)
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const hash = new URLSearchParams(location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const hashType = hash.get("type");

    const params = new URLSearchParams(location.search);
    const tokenHash = params.get("token_hash");
    const qType = params.get("type");

    const isHashRecovery = !!accessToken && !!refreshToken && hashType === "recovery";
    const isQueryRecovery = !!tokenHash && qType === "recovery";

    if (!isHashRecovery && !isQueryRecovery) {
      // No recovery token at all → back to login
      navigate("/auth", { replace: true });
      return;
    }

    handled.current = true;

    if (isHashRecovery) {
      supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! }).then(({ error }) => {
        if (error) {
          setError("Lien expiré ou invalide. Redemande une réinitialisation.");
        } else {
          // Clear the hash so the token can't be reused on refresh
          window.history.replaceState({}, "", window.location.pathname);
          setSessionReady(true);
        }
      });
    } else {
      supabase.auth.verifyOtp({ token_hash: tokenHash!, type: "recovery" }).then(({ error }) => {
        if (error) {
          setError("Lien expiré ou invalide. Redemande une réinitialisation.");
        } else {
          // Clear the query string so the token can't be reused on refresh
          window.history.replaceState({}, "", window.location.pathname);
          setSessionReady(true);
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message.includes("same password") ? "Le nouveau mot de passe doit être différent de l'ancien." : error.message);
    } else {
      setDone(true);
      toast({ title: "Mot de passe mis à jour ✅", description: "Tu peux maintenant te connecter." });
      setTimeout(() => { window.location.href = "/auth"; }, 2500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient mb-4">
            <KeyRound className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold">
            <span className="gold-text">Aurea</span>{" "}
            <span className="text-foreground">Student</span>
          </h1>
        </div>

        {done ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Mot de passe mis à jour ! 🎉</h2>
            <p className="text-sm text-muted-foreground">Redirection vers la connexion…</p>
          </div>
        ) : error && !sessionReady ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">Lien invalide</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-bold text-primary hover:underline cursor-pointer"
            >
              ← Retour à la connexion
            </button>
          </div>
        ) : sessionReady ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Nouveau mot de passe</h2>
            <p className="text-sm text-muted-foreground">Choisis un mot de passe sécurisé (6 caractères minimum).</p>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-2xl border border-border bg-secondary px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-2xl border border-border bg-secondary px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Enregistrer le mot de passe</>}
            </button>
          </form>
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
