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
        { icon: Building2, label: "Aides financières", sub: "CROUS, APL, bourses", route: "/" },
      ] as QuickLink[],
    },
    {
      title: "Mon Avenir",
      subtitle: "Jobs, stages & alternance",
      icon: Briefcase,
      accentClass: "bg-info/15 text-info",
      className: "lg:col-span-1",
      links: [
        { icon: Briefcase, label: "Offres vérifiées", sub: "Jobs & alternance près de toi", route: "/" },
        { icon: GraduationCap, label: "Stages", sub: "Publications validées par les facs", route: "/" },
      ] as QuickLink[],
    },
    {
      title: "Soutien",
      subtitle: "Assistantes sociales & réorientation",
      icon: HeartHandshake,
      accentClass: "bg-success/15 text-success",
      className: "lg:col-span-1",
      links: [
        { icon: Phone, label: "Assistante sociale CROUS", sub: "Contact direct", href: "tel:+33476574400" },
        { icon: MapPin, label: "CROUS Grenoble", sub: "351 allée de la Colline, 38400", href: "https://maps.google.com/?q=CROUS+Grenoble" },
        { icon: BookOpen, label: "Guide réorientation", sub: "Conseils et contacts", route: "/" },
      ] as QuickLink[],
    },
    {
      title: "Santé",
      subtitle: "Soins sans avance de frais",
      icon: Stethoscope,
      accentClass: "bg-destructive/15 text-destructive",
      className: "lg:col-span-2",
      links: [
        { icon: Stethoscope, label: "Médecins conventionnés", sub: "Sans avance de frais (secteur 1)", route: "/" },
        { icon: MapPin, label: "Centre de santé universitaire", sub: "Gratuit pour les étudiants", href: "https://maps.google.com/?q=Centre+santé+université+Grenoble" },
        { icon: Phone, label: "Urgences — 15 / 112", sub: "SAMU & urgences européennes", href: "tel:15" },
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
