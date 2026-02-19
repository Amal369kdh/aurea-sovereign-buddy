import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FolderLock, Users, Sparkles, ArrowRight, Lock, Plane, MapPin } from "lucide-react";
import { useIntegration } from "@/contexts/IntegrationContext";

const WelcomeGuide = () => {
  const navigate = useNavigate();
  const { progress, isInFrance, isFrench } = useIntegration();

  const steps = [
    {
      icon: isInFrance || isFrench ? MapPin : Plane,
      title: isInFrance || isFrench ? "1. Complète tes démarches" : "1. Prépare ton arrivée",
      desc: isInFrance || isFrench
        ? "Suis ta checklist d'installation, coche tes étapes."
        : "Suis la checklist pré-arrivée et anticipe les démarches sur place.",
      action: () => navigate("/mon-dossier"),
      cta: "Mon Dossier",
      done: progress > 30,
    },
    {
      icon: Users,
      title: "2. Rejoins la communauté",
      desc: "Vérifie ton email étudiant pour accéder au Hub Social.",
      action: () => navigate("/hub-social"),
      cta: "Hub Social",
      done: false,
      requiresVerification: true,
    },
    {
      icon: Sparkles,
      title: "3. Demande à Amal",
      desc: "Ton assistante IA pour les démarches administratives.",
      action: () => {},
      cta: "Ouvrir Amal",
      done: false,
    },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <h3 className="text-base font-bold text-foreground mb-1">Par où commencer ? 🗺️</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {isInFrance || isFrench
          ? "Suis ces étapes pour bien démarrer ton intégration."
          : "Prépare ton arrivée en France étape par étape."}
      </p>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 4 }}
            onClick={step.action}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-4 text-left transition-colors hover:border-primary/30 cursor-pointer"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.done ? "gold-gradient" : "bg-secondary"}`}>
              <step.icon className={`h-5 w-5 ${step.done ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
            {step.requiresVerification ? (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeGuide;
