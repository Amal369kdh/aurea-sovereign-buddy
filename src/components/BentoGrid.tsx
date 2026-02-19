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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  onNavigate,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentClass: string;
  links: QuickLink[];
  className?: string;
  onNavigate: (path: string) => void;
}) => (
  <motion.div
    variants={tile}
    className={`group relative overflow-hidden rounded-4xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:card-glow ${className}`}
  >
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

  const tiles = [
    {
      title: "Ma Survie",
      subtitle: "Budget & administratif",
      icon: Shield,
      accentClass: "gold-gradient text-primary-foreground",
      className: "lg:col-span-1 lg:row-span-2",
      links: [
        { icon: Calculator, label: "Simulateur de budget", sub: "Estime tes dépenses mensuelles", route: "/" },
        { icon: ClipboardCheck, label: "Check-list administrative", sub: "Visa, CAF, Sécu, Banque…", route: "/mon-dossier" },
        { icon: Building2, label: "Aides financières", sub: "CROUS, APL, bourses", href: "https://www.messervices.etudiant.gouv.fr" },
        { icon: ExternalLink, label: "Simulateur APL", sub: "Estime ton aide au logement", href: "https://www.caf.fr/allocataires/mes-services-en-ligne/faire-une-simulation" },
        { icon: ClipboardCheck, label: "Demande de bourse CROUS", sub: "DSE en ligne", href: "https://www.messervices.etudiant.gouv.fr/envole/" },
      ] as QuickLink[],
    },
    {
      title: "Mon Avenir",
      subtitle: "Jobs, stages & alternance",
      icon: Briefcase,
      accentClass: "bg-info/15 text-info",
      className: "lg:col-span-1",
      links: [
        { icon: Briefcase, label: "Jobs étudiants", sub: "Offres vérifiées près de toi", href: "https://www.jobaviz.fr/" },
        { icon: GraduationCap, label: "Stages & alternance", sub: "Offres validées par les facs", href: "https://www.1jeune1solution.gouv.fr/" },
        { icon: ExternalLink, label: "Pôle Emploi étudiants", sub: "Accompagnement personnalisé", href: "https://www.francetravail.fr/" },
      ] as QuickLink[],
    },
    {
      title: "Soutien",
      subtitle: "Assistantes sociales & réorientation",
      icon: HeartHandshake,
      accentClass: "bg-success/15 text-success",
      className: "lg:col-span-1",
      links: [
        { icon: Phone, label: "Assistante sociale CROUS", sub: "04 76 57 44 00 — Contact direct", href: "tel:+33476574400" },
        { icon: MapPin, label: "CROUS Grenoble", sub: "351 allée de la Colline, 38400", href: "https://maps.google.com/?q=CROUS+Grenoble" },
        { icon: Phone, label: "Fil Santé Jeunes", sub: "0 800 235 236 — Anonyme & gratuit", href: "tel:0800235236" },
        { icon: BookOpen, label: "Guide réorientation", sub: "Parcoursup, passerelles, conseils", href: "https://www.parcoursup.gouv.fr/" },
      ] as QuickLink[],
    },
    {
      title: "Santé",
      subtitle: "Soins sans avance de frais",
      icon: Stethoscope,
      accentClass: "bg-destructive/15 text-destructive",
      className: "lg:col-span-2",
      links: [
        { icon: Stethoscope, label: "Médecins secteur 1", sub: "Sans avance de frais — Annuaire Ameli", href: "https://annuairesante.ameli.fr/" },
        { icon: MapPin, label: "Centre de santé universitaire", sub: "Gratuit pour étudiants — SSE Grenoble", href: "https://maps.google.com/?q=Service+santé+étudiants+Grenoble" },
        { icon: Phone, label: "SAMU — 15", sub: "Urgences médicales 24h/24", href: "tel:15" },
        { icon: Phone, label: "SOS Médecins Grenoble", sub: "04 76 44 44 44 — Visites à domicile", href: "tel:+33476444444" },
        { icon: ExternalLink, label: "Nightline France", sub: "Écoute psy gratuite entre étudiants", href: "https://www.nightline.fr/" },
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
