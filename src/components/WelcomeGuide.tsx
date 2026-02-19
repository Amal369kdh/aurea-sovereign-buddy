import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FolderLock, Users, Sparkles, ArrowRight, Lock, Plane, MapPin, ShieldCheck, Trophy } from "lucide-react";
import { useIntegration } from "@/contexts/IntegrationContext";

const WelcomeGuide = () => {
  const navigate = useNavigate();
  const { progress, isInFrance, isFrench, isTemoin } = useIntegration();

  const steps = [
    {
      icon: isInFrance || isFrench ? MapPin : Plane,
      title: isInFrance || isFrench ? "1. Complète tes démarches" : "1. Prépare ton arrivée",
      desc: isInFrance || isFrench
        ? "Suis ta checklist d'installation — logement, banque, sécu, CAF."
        : "Anticipe visa, Campus France, assurance et logement avant de partir.",
      action: () => navigate("/mon-dossier"),
      cta: "Mon Dossier",
      done: progress > 30,
    },
    {
      icon: Users,
      title: "2. Rejoins la communauté",
      desc: isTemoin
        ? "Tu es vérifié(e) ! Accède au Hub Social et aux Rencontres."
        : "Vérifie ton email étudiant (.edu/.fr) pour débloquer le Hub.",
      action: () => navigate("/hub-social"),
      cta: "Hub Social",
      done: isTemoin,
      requiresVerification: !isTemoin,
    },
    {
      icon: Sparkles,
      title: "3. Demande à Amal",
      desc: progress >= 20
        ? "Ton assistante IA est prête — pose-lui tes questions administratives."
        : `Atteins 20% d'intégration pour débloquer Amal (${progress}%/20%).`,
      action: () => {},
      cta: progress >= 20 ? "Ouvrir Amal" : `${progress}% / 20%`,
      done: progress >= 20,
      locked: progress < 20,
    },
  ];

  // Add a France-specific step for non-France users
  if (isInFrance === false && !isFrench) {
    steps.push({
      icon: ShieldCheck,
      title: "4. Débloque le dashboard",
      desc: "Les tuiles Survie, Avenir, Soutien et Santé se débloquent à ton arrivée.",
      action: () => navigate("/mon-dossier"),
      cta: "Voir les démarches",
      done: false,
      requiresVerification: false,
      locked: true,
    } as any);
  }

  // Add gamification hint
  if (isTemoin && progress >= 30) {
    steps.push({
      icon: Trophy,
      title: isInFrance || isFrench ? "4. Aide la communauté" : "5. Aide la communauté",
      desc: "Publie sur le Hub Entraide et gagne des points Ligue des Facs (+5/post).",
      action: () => navigate("/hub-social"),
      cta: "Publier",
      done: false,
      requiresVerification: false,
    } as any);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <h3 className="text-base font-bold text-foreground mb-1">Par où commencer ? 🗺️</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {isInFrance || isFrench
          ? "Suis ces étapes pour bien démarrer ton intégration en France."
          : "Prépare ton arrivée en France étape par étape — on t'accompagne."}
      </p>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.button
            key={i}
            whileHover={{ x: 4 }}
            onClick={step.action}
            className={`flex w-full items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-4 text-left transition-colors cursor-pointer ${
              (step as any).locked
                ? "opacity-50 pointer-events-none"
                : "hover:border-primary/30"
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.done ? "gold-gradient" : "bg-secondary"}`}>
              <step.icon className={`h-5 w-5 ${step.done ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
            {(step as any).requiresVerification ? (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (step as any).locked ? (
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
