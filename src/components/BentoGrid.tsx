import { motion } from "framer-motion";
import {
  Shield,
  Briefcase,
  HeartHandshake,
  Stethoscope,
  Calculator,
  ClipboardCheck,
  GraduationCap,
  ExternalLink,
  Phone,
  MapPin,
  Building2,
  BookOpen,
  ChevronRight,
  Lock,
  Plane,
  Home,
  Landmark,
  Scale,
  Utensils,
  Bus,
  Dumbbell,
  Heart,
  Brain,
  Globe,
  FileText,
  HandCoins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIntegration } from "@/contexts/IntegrationContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const tile = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface QuickLink {
  icon: React.ElementType;
  label: string;
  sub?: string;
  href?: string;
  route?: string;
}

/* ─── Tile component ─── */
const BentoTile = ({
  title,
  subtitle,
  icon: Icon,
  accentClass,
  links,
  className = "",
  locked = false,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentClass: string;
  links: QuickLink[];
  className?: string;
  locked?: boolean;
  onNavigate: (path: string) => void;
}) => (
  <motion.div
    variants={tile}
    className={`group relative overflow-hidden rounded-4xl border border-border bg-card p-6 transition-all ${
      locked ? "opacity-60 pointer-events-none select-none" : "hover:border-primary/20 hover:card-glow"
    } ${className}`}
  >
    {/* Lock overlay */}
    {locked && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-4xl bg-background/80 backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-bold text-foreground">Disponible en France</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cette section se débloquera quand tu seras sur le territoire français.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <Plane className="h-3 w-3" />
          En attente d'arrivée
        </div>
      </div>
    )}

    {/* Header */}
    <div className="mb-5 flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>

    {/* Links */}
    <div className="space-y-2">
      {links.map((link) => (
        <button
          key={link.label}
          onClick={() => {
            if (locked) return;
            if (link.href) window.open(link.href, "_blank", "noopener");
            else if (link.route) onNavigate(link.route);
          }}
          className="flex w-full items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3 text-left transition-all hover:bg-secondary cursor-pointer"
        >
          <link.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{link.label}</p>
            {link.sub && <p className="text-xs text-muted-foreground truncate">{link.sub}</p>}
          </div>
          {link.href ? (
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  </motion.div>
);

/* ─── Main grid ─── */
const BentoGrid = () => {
  const navigate = useNavigate();
  const { isInFrance, isFrench } = useIntegration();

  // Tiles are locked when user is NOT in France and NOT French
  const shouldLock = isInFrance === false && !isFrench;

  const tiles = [
    {
      title: "Ma Survie",
      subtitle: "Budget, logement & administratif",
      icon: Shield,
      accentClass: "gold-gradient text-primary-foreground",
      className: "lg:col-span-1 lg:row-span-2",
      locked: shouldLock,
      links: [
        { icon: Calculator, label: "Simulateur de budget", sub: "Estime tes dépenses mensuelles", route: "/" },
        { icon: ClipboardCheck, label: "Check-list administrative", sub: "Visa, CAF, Sécu, banque — tout en un", route: "/mon-dossier" },
        { icon: Building2, label: "Aides financières", sub: "CROUS, APL, bourses, aides d'urgence", href: "https://www.messervices.etudiant.gouv.fr" },
        { icon: Home, label: "Simulateur APL", sub: "Calcule ton aide au logement en 2 min", href: "https://www.caf.fr/allocataires/mes-services-en-ligne/faire-une-simulation" },
        { icon: HandCoins, label: "Bourse CROUS (DSE)", sub: "Demande en ligne — deadline octobre", href: "https://www.messervices.etudiant.gouv.fr/envole/" },
        { icon: Landmark, label: "Aide d'urgence CROUS", sub: "Si tu es en difficulté financière", href: "https://www.etudiant.gouv.fr/fr/aides-specifiques-702" },
      ] as QuickLink[],
    },
    {
      title: "Mon Avenir",
      subtitle: "Jobs, stages, alternance & carrière",
      icon: Briefcase,
      accentClass: "bg-info/15 text-info",
      className: "lg:col-span-1",
      locked: shouldLock,
      links: [
        { icon: Briefcase, label: "Jobs étudiants", sub: "Offres vérifiées — 20h/sem max", href: "https://www.jobaviz.fr/" },
        { icon: GraduationCap, label: "Stages & alternance", sub: "1jeune1solution — offres nationales", href: "https://www.1jeune1solution.gouv.fr/" },
        { icon: Globe, label: "France Travail", sub: "Accompagnement et offres d'emploi", href: "https://www.francetravail.fr/" },
        { icon: FileText, label: "Rédiger son CV", sub: "Modèles gratuits adaptés aux étudiants", href: "https://www.canva.com/fr_fr/cv/" },
      ] as QuickLink[],
    },
    {
      title: "Soutien",
      subtitle: "Aide sociale, psycho & réorientation",
      icon: HeartHandshake,
      accentClass: "bg-success/15 text-success",
      className: "lg:col-span-1",
      locked: shouldLock,
      links: [
        { icon: Phone, label: "Assistante sociale CROUS", sub: "04 76 57 44 00 — Grenoble", href: "tel:+33476574400" },
        { icon: MapPin, label: "CROUS Grenoble", sub: "351 allée de la Colline, 38400", href: "https://maps.google.com/?q=CROUS+Grenoble" },
        { icon: Brain, label: "Fil Santé Jeunes", sub: "0 800 235 236 — Anonyme & gratuit", href: "tel:0800235236" },
        { icon: BookOpen, label: "Réorientation Parcoursup", sub: "Passerelles, vœux, conseils", href: "https://www.parcoursup.gouv.fr/" },
        { icon: Scale, label: "Aide juridique gratuite", sub: "CDAD — accès au droit pour étudiants", href: "https://www.justice.fr/themes/acces-droit" },
      ] as QuickLink[],
    },
    {
      title: "Santé",
      subtitle: "Soins, urgences & bien-être",
      icon: Stethoscope,
      accentClass: "bg-destructive/15 text-destructive",
      className: "lg:col-span-2",
      locked: shouldLock,
      links: [
        { icon: Stethoscope, label: "Médecins secteur 1", sub: "Sans avance de frais — Annuaire Ameli", href: "https://annuairesante.ameli.fr/" },
        { icon: MapPin, label: "Centre santé universitaire", sub: "Gratuit — SSE de ton campus", href: "https://maps.google.com/?q=Service+santé+étudiants+Grenoble" },
        { icon: Phone, label: "SAMU — 15", sub: "Urgences médicales 24h/24", href: "tel:15" },
        { icon: Phone, label: "SOS Médecins Grenoble", sub: "04 76 44 44 44 — Visites à domicile", href: "tel:+33476444444" },
        { icon: Heart, label: "Nightline France", sub: "Écoute psy gratuite entre étudiants", href: "https://www.nightline.fr/" },
        { icon: Utensils, label: "Repas à 1€ CROUS", sub: "Tous les restos U à tarif solidaire", href: "https://www.etudiant.gouv.fr/fr/le-repas-au-crous-1204" },
        { icon: Dumbbell, label: "Sport universitaire (SUAPS)", sub: "Activités gratuites sur ton campus", href: "https://suaps.univ-grenoble-alpes.fr/" },
        { icon: Bus, label: "Transport TAG étudiant", sub: "Abonnement réduit — Grenoble métropole", href: "https://www.tag.fr/" },
      ] as QuickLink[],
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:grid-cols-2"
    >
      {tiles.map((t) => (
        <BentoTile key={t.title} {...t} onNavigate={navigate} />
      ))}
    </motion.div>
  );
};

export default BentoGrid;
