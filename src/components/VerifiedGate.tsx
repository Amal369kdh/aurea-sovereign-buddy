import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface VerifiedGateProps {
  children: React.ReactNode;
  featureName?: string;
}

/**
 * Blocks access to children unless the user has status 'temoin'
 * (verified with a student email .edu / .fr / .univ).
 * Shows a friendly gate UI instead.
 */
const VerifiedGate = ({ children, featureName = "cette fonctionnalité" }: VerifiedGateProps) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setStatus((data as any)?.status ?? "explorateur");
        setLoading(false);
      });
  }, [user]);

  if (loading) return null;

  if (status === "temoin") return <>{children}</>;

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
          vérifie ton identité avec un email universitaire (.edu, .univ.fr, .fr).
        </p>

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

        <button
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          onClick={() => {
            // TODO: open email verification flow
          }}
        >
          Vérifier mon email étudiant <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};

export default VerifiedGate;
