import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Mail, Lock, User, ArrowRight, Loader2, MailCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ── Traduction des erreurs Supabase → Français ──────────────────────────────
function translateAuthError(error: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "Email not confirmed": "Tu dois d'abord confirmer ton email. Vérifie ta boîte mail.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
    "Signup requires a valid password": "Le mot de passe est invalide.",
    "Unable to validate email address: invalid format": "L'adresse email n'est pas valide.",
    "Email rate limit exceeded": "Trop de tentatives. Attends quelques minutes avant de réessayer.",
    "For security purposes, you can only request this after": "Trop de tentatives. Attends quelques minutes avant de réessayer.",
    "over_email_send_rate_limit": "Trop d'emails envoyés. Attends quelques minutes.",
    "User not found": "Aucun compte trouvé avec cet email.",
    "New password should be different from the old password": "Le nouveau mot de passe doit être différent de l'ancien.",
    "Auth session missing": "Session expirée, reconnecte-toi.",
    "Invalid Refresh Token": "Session expirée. Reconnecte-toi.",
    "Token has expired or is invalid": "Le lien a expiré. Demande un nouveau.",
    "Anonymous sign-ins are disabled": "La connexion anonyme est désactivée.",
  };
  for (const [key, value] of Object.entries(map)) {
    if (error.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return error;
}

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedCgu, setAcceptedCgu] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [forgotDone, setForgotDone] = useState(false);
  // When the user already has an unconfirmed account
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── État : email déjà inscrit mais non confirmé ──────────────────────────
  if (pendingConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient mb-4">
              <MailCheck className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold">
              <span className="gold-text">Aurea</span>{" "}
              <span className="text-foreground">Student</span>
            </h1>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Compte en attente de confirmation ⏳</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un compte existe déjà pour{" "}
              <span className="font-semibold text-foreground">{signupEmail}</span>, mais l'email n'a pas encore été confirmé.
              <br /><br />
              Vérifie ta boîte mail (et tes spams) et clique sur le lien de confirmation pour activer ton compte.
            </p>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.resend({
                  type: "signup",
                  email: signupEmail,
                  options: { emailRedirectTo: "https://aurea-student.fr" },
                });
                // If error or account was deleted from dashboard → redirect to signup
                if (error) {
                  if (error.message.toLowerCase().includes("user not found") || error.message.toLowerCase().includes("invalid") || error.status === 422) {
                    setPendingConfirmation(false);
                    setEmail(signupEmail);
                    setMode("signup");
                    toast({ title: "Compte introuvable", description: "Ce compte n'existe plus. Recrée-le.", variant: "destructive" });
                  } else {
                    toast({ title: "Erreur", description: translateAuthError(error.message), variant: "destructive" });
                  }
                } else {
                  toast({ title: "Email renvoyé ✅", description: "Vérifie ta boîte mail (et tes spams)." });
                }
              }}
              className="w-full rounded-2xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              Renvoyer l'email de confirmation
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà confirmé ?{" "}
            <button
              onClick={() => { setPendingConfirmation(false); setMode("login"); }}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // ── État post-inscription : confirmation envoyée ──────────────────────────
  if (signupDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient mb-4">
              <MailCheck className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold">
              <span className="gold-text">Aurea</span>{" "}
              <span className="text-foreground">Student</span>
            </h1>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Vérifie ta boîte mail ✉️</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un email de confirmation a été envoyé à{" "}
              <span className="font-semibold text-foreground">{signupEmail}</span>.
              <br /><br />
              Clique sur le lien de confirmation pour activer ton compte et rejoindre le cercle.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Vérifie aussi tes spams si tu ne vois pas l'email.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà confirmé ?{" "}
            <button
              onClick={() => { setSignupDone(false); setMode("login"); }}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // ── État : mot de passe oublié ────────────────────────────────────────────
  if (mode === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient mb-4">
              <KeyRound className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold">
              <span className="gold-text">Aurea</span>{" "}
              <span className="text-foreground">Student</span>
            </h1>
          </div>

          {forgotDone ? (
            <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Email envoyé ✅</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Un lien de réinitialisation a été envoyé à{" "}
                <span className="font-semibold text-foreground">{email}</span>.<br /><br />
                Clique sur ce lien pour choisir un nouveau mot de passe. Vérifie aussi tes spams.
              </p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: "https://aurea-student.fr/reset-password",
                });
                setSubmitting(false);
                if (error) {
                  toast({ title: "Erreur", description: translateAuthError(error.message), variant: "destructive" });
                } else {
                  setForgotDone(true);
                }
              }}
              className="space-y-4 rounded-3xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-bold text-foreground">Mot de passe oublié ?</h2>
              <p className="text-sm text-muted-foreground">Saisis ton email pour recevoir un lien de réinitialisation.</p>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-secondary px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Envoyer le lien</>}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <button
              onClick={() => { setMode("login"); setForgotDone(false); }}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              ← Retour à la connexion
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "signup") {
      const { error, data } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: "Erreur", description: translateAuthError(error), variant: "destructive" });
      } else {
        // Supabase returns identities:[] when the email already exists but is unconfirmed
        if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
          setSignupEmail(email);
          setPendingConfirmation(true);
        } else {
          // Pre-create profile so ProtectedRoute doesn't spin waiting for the DB trigger.
          // We only set safe defaults — onboarding will fill nationality/city/etc.
          // We do NOT set is_in_france or student_status here so the onboarding
          // completeness check sends them to /onboarding as expected.
          if (data?.user?.id) {
            try {
              await supabase.from("profiles").upsert({
                user_id: data.user.id,
                display_name: displayName,
                avatar_initials: displayName.slice(0, 2).toUpperCase(),
                status: "explorateur",
              }, { onConflict: "user_id" });
            } catch {
              // Ignore — the DB trigger will create the profile on confirmation
            }
          }
          setSignupEmail(email);
          setSignupDone(true);
        }
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erreur", description: translateAuthError(error), variant: "destructive" });
      }
    }

    setSubmitting(false);
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
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold">
            <span className="gold-text">Aurea</span>{" "}
            <span className="text-foreground">Student</span>
          </h1>
        </div>

        {/* Welcome text */}
        <div className="mb-10 flex flex-col items-center text-center" style={{ maxWidth: 500, margin: "0 auto 2.5rem" }}>
          <h2 style={{ color: "hsl(43 96% 56%)", fontWeight: 600, fontSize: "1.5rem" }}>
            Bienvenue dans notre cercle.
          </h2>
          <p style={{ color: "#EAEAEA", fontSize: "0.9rem", marginTop: 8 }}>
            Tu es à ta place.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Prénom ou pseudo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-secondary px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-border bg-secondary px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-border bg-secondary px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {mode === "signup" && (
            <label className="flex items-start gap-3 cursor-pointer group rounded-2xl border border-border/60 bg-secondary/40 p-3 hover:bg-secondary/70 transition-colors">
              <input
                type="checkbox"
                checked={acceptedCgu}
                onChange={(e) => setAcceptedCgu(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border border-primary bg-secondary accent-primary cursor-pointer"
              />
              <span className="text-xs text-foreground leading-relaxed">
                J'ai lu et j'accepte les{" "}
                <a
                  href="/legal#cgu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold underline decoration-dotted"
                  onClick={(e) => e.stopPropagation()}
                >
                  Conditions Générales d'Utilisation
                </a>{" "}
                et la{" "}
                <a
                  href="/legal#rgpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold underline decoration-dotted"
                  onClick={(e) => e.stopPropagation()}
                >
                  Politique de Confidentialité
                </a>{" "}
                (RGPD)
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={submitting || (mode === "signup" && !acceptedCgu)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-bold text-primary hover:underline cursor-pointer"
          >
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>

        {/* Legal link */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          <a href="/legal" className="hover:text-muted-foreground transition-colors">
            Mentions légales · CGU · Confidentialité
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
