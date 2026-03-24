import DashboardHeader from "@/components/DashboardHeader";
import PhaseChecklist from "@/components/PhaseChecklist";
import AlphaVault from "@/components/AlphaVault";
import AmalTrigger from "@/components/AyaTrigger";
import SecuritySovereign from "@/components/SecuritySovereign";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useIntegration } from "@/contexts/IntegrationContext";
import { MapPin, ArrowRight, Lock, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Villes actuellement actives (dashboard + dossier complets)
const ACTIVE_CITIES = ["grenoble"];

const MonDossier = () => {
  const { flags } = useFeatureFlags();
  const { isInFrance, setIsInFrance } = useIntegration();
  const { user } = useAuth();
  const dossierEnabled = flags["mon_dossier"] !== false;

  const [userCity, setUserCity] = useState<string | null>(null);
  const [cityLoading, setCityLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCityLoading(false); return; }
    supabase
      .from("profiles")
      .select("city, target_city")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const city = (data?.city || data?.target_city || "grenoble").toLowerCase().trim();
        setUserCity(city);
        setCityLoading(false);
      });
  }, [user]);

  const isCityActive = !cityLoading && ACTIVE_CITIES.includes(userCity ?? "");

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />
        <div className="px-6 pb-28">
          {dossierEnabled ? (
            <>
              {/* Ville inactive → section post-arrivée verrouillée, pré-arrivée reste accessible */}
              {!cityLoading && !isCityActive ? (
                <div className="space-y-6">
                  {/* Bannière ville bientôt disponible */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-primary/20 bg-primary/5 px-5 py-5 flex items-start gap-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground capitalize">
                        {userCity
                          ? `${userCity.charAt(0).toUpperCase() + userCity.slice(1)} arrive bientôt ⚡`
                          : "Ta ville arrive bientôt ⚡"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Les démarches et ressources spécifiques à ta ville sont en cours de préparation. 
                        Dès que ta ville sera activée, tu auras accès à ton parcours d'intégration personnalisé.
                      </p>
                      <p className="mt-2 text-xs font-semibold text-primary">
                        En attendant, tu peux accéder au Hub Social et préparer ta pré-arrivée ci-dessous 👇
                      </p>
                    </div>
                  </motion.div>

                  {/* Pré-arrivée toujours accessible (indépendante de la ville) */}
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-3">Pré-arrivée</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Ces étapes sont valables quelle que soit ta ville d'arrivée en France.
                    </p>
                    <PhaseChecklist preArrivalOnly />
                  </div>

                  {/* Aperçu verrouillé des sections post-arrivée */}
                  <div className="rounded-3xl border border-border/50 bg-card/50 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Démarches sur place</p>
                        <p className="text-xs text-muted-foreground">Disponible dès l'activation de ta ville</p>
                      </div>
                    </div>
                    <div className="space-y-2 opacity-40 pointer-events-none select-none">
                      {["🏠 Installation", "⚖️ Démarches légales", "🌍 Vie quotidienne", "💰 Finances & Aides"].map((label) => (
                        <div key={label} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-secondary/30 px-4 py-3">
                          <span className="text-sm">{label.split(" ")[0]}</span>
                          <span className="text-xs font-medium text-muted-foreground">{label.split(" ").slice(1).join(" ")}</span>
                          <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bannière contextuelle si l'utilisateur n'a pas indiqué être en France */}
                  {!cityLoading && (isInFrance === null || isInFrance === false) && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 rounded-3xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-start gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gold-gradient">
                        <MapPin className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">
                          {isInFrance === false
                            ? "Tu es maintenant en France ? Débloque tes démarches 🇫🇷"
                            : "Indique si tu es en France pour débloquer les démarches 🇫🇷"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Les sections Logement, Sécu, CAF et plus se débloquent automatiquement une fois que tu confirmes ton arrivée.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsInFrance(true)}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl gold-gradient px-3 py-2 text-xs font-bold text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Je suis en France
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  )}
                  <PhaseChecklist />
                  <AlphaVault />
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
              <span className="text-4xl">🔒</span>
              <p className="text-lg font-bold text-foreground">Mon Dossier temporairement désactivé</p>
              <p className="text-sm text-muted-foreground">Cette section est momentanément indisponible. Revenez bientôt.</p>
            </div>
          )}
        </div>
      </main>
      <SecuritySovereign />
      <AmalTrigger />
      <MobileBottomNav />
    </div>
  );
};

export default MonDossier;

