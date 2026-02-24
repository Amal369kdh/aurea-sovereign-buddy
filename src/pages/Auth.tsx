import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: "Erreur", description: error, variant: "destructive" });
      } else {
        toast({ title: "Compte créé ✨", description: "Préparation de ton espace…" });
        // The ProtectedRoute will wait for profile creation via retry logic
        // No need for manual delay — just trigger a full reload to re-evaluate
        setSubmitting(false);
        window.location.href = "/";
        return;
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erreur", description: error, variant: "destructive" });
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
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gold-gradient mb-4">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold">
            <span className="gold-text">Aurea</span>{" "}
            <span className="text-foreground">Student</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Connecte-toi à ton espace" : "Crée ton compte étudiant"}
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

          <button
            type="submit"
            disabled={submitting}
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
      </motion.div>
    </div>
  );
};

export default Auth;
