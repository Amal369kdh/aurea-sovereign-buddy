import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, HeartHandshake, Stethoscope, Calculator, ClipboardCheck,
  GraduationCap, ExternalLink, Phone, MapPin, Building2, BookOpen, ChevronRight, ChevronDown,
  Lock, Home, Landmark, Scale, Utensils, Bus, Dumbbell, Heart, Brain,
  Globe, FileText, HandCoins, Loader2, Sparkles, ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCityResources } from "@/hooks/useCityResources";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerificationDialog from "@/components/VerificationDialog";

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
  perplexity?: boolean;
}

// Mapping tuile → phase de checklist dans Mon Dossier
const TILE_CHECKLIST_MAP: Record<string, string> = {
  "Logement": "Logement & Installation",
  "Préfecture": "Titre de séjour",
  "Aides & Administratif": "CAF, bourses & aides",
  "Banque": "Ouvrir un compte",
  "Santé": "Mutuelle & santé",
  "Vie pratique": "Vie quotidienne",
  "Mon Avenir": "Jobs & carrière",
  "Soutien": "Aide sociale",
};

/* ─── Tile component ─── */
const BentoTile = ({
  title, subtitle, icon: Icon, accentClass, links, className = "", locked = false, onNavigate, onUnlock, conseil, step, alerte,
}: {
  title: string; subtitle: string; icon: React.ElementType; accentClass: string;
  links: QuickLink[]; className?: string; locked?: boolean; onNavigate: (path: string) => void; onUnlock?: () => void; conseil?: string; step?: number; alerte?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const checklistLabel = TILE_CHECKLIST_MAP[title];

  return (
    <motion.div
      variants={tile}
      className={`group relative overflow-hidden rounded-4xl border border-border bg-card transition-all ${
        locked ? "" : "hover:border-primary/20 hover:card-glow"
      } ${className}`}
    >
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-4xl bg-background/60 backdrop-blur-[3px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center px-6">
            <p className="text-sm font-bold text-foreground">Disponible en France</p>
            <p className="text-xs text-muted-foreground mt-1">
              Vérifie ton email étudiant pour débloquer cette section.
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onUnlock?.(); }}
            className="flex items-center gap-1.5 rounded-full gold-gradient px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Vérifier mon email étudiant
          </button>
        </div>
      )}

      {/* Clickable header */}
      <button
        onClick={() => !locked && setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 p-6 text-left cursor-pointer"
      >
        {step !== undefined && (
          <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
            {step}
          </span>
        )}
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium">{links.length}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible links */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-6 pb-4">
              {/* Alerte urgence (ex: renouvellement CROUS) */}
              {alerte && (
                <div className="flex items-start gap-2 rounded-2xl bg-destructive/5 border border-destructive/20 px-4 py-3 mb-1">
                  <span className="text-sm shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs text-destructive/90 leading-relaxed font-medium">{alerte.replace(/^⚠️\s*/, "")}</p>
                </div>
              )}
              {conseil && (
                <div className="flex items-start gap-2 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3 mb-1">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{conseil}</p>
                </div>
              )}
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{link.label}</p>
                      {link.perplexity && <Sparkles className="h-3 w-3 shrink-0 text-primary" />}
                    </div>
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

            {/* Lien vers la checklist Mon Dossier */}
            {checklistLabel && !locked && (
              <button
                onClick={() => onNavigate("/mon-dossier")}
                className="flex w-full items-center justify-between border-t border-border/40 px-6 py-3 text-left transition-colors hover:bg-secondary/30 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Cocher dans ma checklist</span>
                  <span className="text-xs text-muted-foreground">— {checklistLabel}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}

            {/* Bannière partenaires — Logement */}
            {title === "Logement" && !locked && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                <span className="text-sm">🤝</span>
                <p className="text-xs text-primary/80 leading-snug">
                  <span className="font-semibold text-primary">Plateformes partenaires et offres exclusives</span> arrivent bientôt ⚡
                </p>
              </div>
            )}

            {/* Bannière partenaires — Banque */}
            {title === "Banque" && !locked && (
              <button
                onClick={() => onNavigate("/partners")}
                className="mx-6 mb-4 flex w-[calc(100%-3rem)] items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-left transition-colors hover:bg-primary/10 cursor-pointer"
              >
                <span className="text-sm">🤝</span>
                <p className="flex-1 text-xs text-primary/80 leading-snug">
                  <span className="font-semibold text-primary">Offres partenaires & comparateur de comptes étudiants</span> — voir tout ⚡
                </p>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              </button>
            )}

            {/* Bannière partenaires — Santé */}
            {title === "Santé" && !locked && (
              <button
                onClick={() => onNavigate("/partners")}
                className="mx-6 mb-4 flex w-[calc(100%-3rem)] items-center gap-2 rounded-2xl border border-success/20 bg-success/5 px-4 py-2.5 text-left transition-colors hover:bg-success/10 cursor-pointer"
              >
                <span className="text-sm">🛡️</span>
                <p className="flex-1 text-xs text-success/80 leading-snug">
                  <span className="font-semibold">Mutuelle étudiante partenaire</span> — comparatif LMDE, HEYME, April arrive bientôt
                </p>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-success/60" />
              </button>
            )}

            {/* Bannière partenaires — Mon Avenir */}
            {title === "Mon Avenir" && !locked && (
              <button
                onClick={() => onNavigate("/partners")}
                className="mx-6 mb-4 flex w-[calc(100%-3rem)] items-center gap-2 rounded-2xl border border-info/20 bg-info/5 px-4 py-2.5 text-left transition-colors hover:bg-info/10 cursor-pointer"
              >
                <span className="text-sm">💼</span>
                <p className="flex-1 text-xs text-info/80 leading-snug">
                  <span className="font-semibold">Jobs étudiants & alternance partenaires</span> — offres exclusives bientôt
                </p>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-info/60" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Default tiles ─── ordre chronologique pour un étudiant arrivant en France */
const defaultTiles = (city: string) => [
  // ÉTAPE 1 — Trouver un logement
  {
    step: 1,
    title: "Logement",
    subtitle: "Résidences CROUS & plateformes locales",
    icon: Home,
    accentClass: "bg-warning/15 text-warning",
    className: "",
    lockable: true,
    // ⚠️ Alerte renouvellement CROUS 2026 (Grenoble only for now)
    _alerte: city.toLowerCase() === "grenoble"
      ? "⚠️ Renouvellement CROUS 2026 : du 10 mars au 4 mai. Sur messervices.etudiant.gouv.fr → Cité'U → Grenoble → « Mon logement actuel » → « Demander mon renouvellement ». Passé le 4 mai = perte de ta chambre pour la rentrée."
      : undefined,
    links: [
      { icon: Building2, label: "Résidences CROUS", sub: "Dossier social étudiant (DSE)", href: "https://www.messervices.etudiant.gouv.fr" },
      { icon: Globe, label: "Lokaviz CROUS", sub: "Logements chez l'habitant", href: "https://lokaviz.fr" },
      { icon: Home, label: "Simulateur APL (CAF)", sub: "Calcule ton aide au logement en 2 min", href: "https://www.caf.fr/allocataires/mes-services-en-ligne/faire-une-simulation" },
      { icon: Globe, label: "SeLoger Étudiant", sub: "Colocations et studios", href: "https://www.seloger.com" },
    ] as QuickLink[],
  },
  // ÉTAPE 2 — Titre de séjour & préfecture
  {
    step: 2,
    title: "Préfecture",
    subtitle: "Titre de séjour — ANEF & Bâtiment MUSE",
    icon: Landmark,
    accentClass: "bg-info/15 text-info",
    className: "",
    lockable: true,
    links: [
      { icon: Globe, label: "Portail ANEF — VLS-TS en ligne", sub: "Validation du titre de séjour • 75 €", href: "https://administration-etrangers-en-france.interieur.gouv.fr/" },
      { icon: MapPin, label: "Bâtiment MUSE (antenne campus)", sub: "80 allée Ampère, Domaine Universitaire • ex-ISSO", href: "https://maps.google.com/?q=Bâtiment+MUSE+80+allée+Ampère+Grenoble" },
      { icon: MapPin, label: "Préfecture de l'Isère", sub: "Place de Verdun, Grenoble • retrait carte de séjour", href: "https://maps.google.com/?q=Préfecture+Isère+Place+de+Verdun+Grenoble" },
    ] as QuickLink[],
  },
  // ÉTAPE 3 — Aides financières & administratif (APL retiré — il est dans Logement)
  {
    step: 3,
    title: "Aides & Administratif",
    subtitle: "Bourses, budget & inscription fac",
    icon: ClipboardCheck,
    accentClass: "gold-gradient text-primary-foreground",
    className: "",
    lockable: true,
    links: [
      { icon: ClipboardCheck, label: "Check-list administrative", sub: "Visa, CAF, Sécu, banque — tout en un", route: "/mon-dossier" },
      { icon: HandCoins, label: "Bourse CROUS (DSE)", sub: "Demande en ligne — deadline octobre", href: "https://www.messervices.etudiant.gouv.fr/envole/" },
      { icon: GraduationCap, label: "Inscription universitaire", sub: "Dossier parcoursup ou admission directe", href: "https://www.parcoursup.fr/" },
      { icon: Calculator, label: "Simulateur de budget étudiant", sub: "Estime tes dépenses mensuelles", href: "https://www.etudiant.gouv.fr/fr/simulateur-de-budget-1428" },
      { icon: Landmark, label: "Aide d'urgence CROUS", sub: "Si tu es en difficulté financière", href: "https://www.etudiant.gouv.fr/fr/aides-specifiques-702" },
    ] as QuickLink[],
  },
  // ÉTAPE 4 — Banque
  {
    step: 4,
    title: "Banque",
    subtitle: "Ouvrir un compte étudiant",
    icon: Landmark,
    accentClass: "bg-primary/15 text-primary",
    className: "",
    lockable: true,
    links: [
      { icon: Globe, label: "Hello Bank", sub: "Compte gratuit étudiant", href: "https://www.hellobank.fr" },
      { icon: Globe, label: "BNP Paribas", sub: "Esprit Libre Étudiant", href: "https://mabanque.bnpparibas.com" },
      { icon: Globe, label: "Boursorama", sub: "Bienvenue Étudiant", href: "https://www.boursobank.com" },
      { icon: Globe, label: "Revolut", sub: "Compte multi-devises gratuit", href: "https://www.revolut.com/fr" },
      { icon: Globe, label: "N26", sub: "Compte mobile sans frais", href: "https://n26.com/fr-fr" },
    ] as QuickLink[],
  },
  // ÉTAPE 5 — Santé (point de repère unique = Bâtiment MUSE à Grenoble)
  {
    step: 5,
    title: "Santé",
    subtitle: "Soins, urgences & bien-être",
    icon: Stethoscope,
    accentClass: "bg-destructive/15 text-destructive",
    className: "",
    lockable: true,
    links: [
      { icon: Stethoscope, label: "Médecins secteur 1", sub: "Sans avance de frais — Annuaire Ameli", href: "https://annuairesante.ameli.fr/" },
      ...(city.toLowerCase() === "grenoble"
        ? [{ icon: MapPin as React.ElementType, label: "Centre de Santé Étudiant — MUSE", sub: "80 allée Ampère, St-Martin-d'Hères • Secteur 1, sans avance de frais", href: "https://maps.google.com/?q=Bâtiment+MUSE+80+allée+Ampère+Saint-Martin-d%27Hères" }]
        : [{ icon: MapPin as React.ElementType, label: "Centre de santé universitaire", sub: `Campus de ${city} — Service de santé étudiante`, href: `https://maps.google.com/?q=Service+sant%C3%A9+%C3%A9tudiants+${encodeURIComponent(city)}` }]
      ),
      { icon: Phone, label: "SAMU — 15", sub: "Urgences médicales 24h/24", href: "tel:15" },
      { icon: Heart, label: "Nightline France", sub: "Écoute psy gratuite entre étudiants", href: "https://www.nightline.fr/" },
    ] as QuickLink[],
  },
  // ÉTAPE 6 — Vie pratique
  {
    step: 6,
    title: "Vie pratique",
    subtitle: "M réso, vélos, repas à 1€ & sport",
    icon: Bus,
    accentClass: "bg-success/15 text-success",
    className: "",
    lockable: true,
    links: [
      { icon: Bus, label: "M réso — Abo étudiant solidaire", sub: "Tarif réduit selon QF CAF • Agences Gare & Grand'Place", href: "https://www.mreso.fr/" },
      { icon: Globe, label: "M vélo+ — Vélos en location", sub: "Tarif réduit sur présentation QF CAF • Agences Gare & MUSE", href: "https://www.mreso.fr/mveloplus" },
      { icon: Utensils, label: "Repas à 1€ CROUS", sub: "Tous les restos U à tarif solidaire", href: "https://www.etudiant.gouv.fr/fr/le-repas-au-crous-1204" },
      { icon: Dumbbell, label: "Sport universitaire (SUAPS)", sub: `50+ activités gratuites sur le campus`, href: `https://maps.google.com/?q=SUAPS+${city}` },
      { icon: Phone, label: "Ticket SMS dépannage", sub: "SMS au 93123 — achète un ticket de bus sans appli", href: "sms:93123" },
    ] as QuickLink[],
  },
  // ÉTAPE 7 — Carrière & avenir
  {
    step: 7,
    title: "Mon Avenir",
    subtitle: "Orientation, jobs, stages & carrière",
    icon: Briefcase,
    accentClass: "bg-info/15 text-info",
    className: "",
    lockable: true,
    links: [
      { icon: MapPin, label: "Espace OIP — Réorientation", sub: "150 av. centrale, campus • Pour ceux qui doutent de leur voie", href: `https://maps.google.com/?q=Espace+OIP+Grenoble+150+avenue+centrale` },
      { icon: Briefcase, label: "Jobs étudiants — Jobaviz", sub: "Offres vérifiées CROUS • 20h/sem max", href: "https://www.jobaviz.fr/" },
      { icon: GraduationCap, label: "Stages & alternance", sub: "1jeune1solution — offres nationales", href: "https://www.1jeune1solution.gouv.fr/" },
      { icon: Globe, label: "France Travail", sub: "Accompagnement et offres d'emploi", href: "https://www.francetravail.fr/" },
      { icon: FileText, label: "Rédiger son CV", sub: "Modèles gratuits adaptés aux étudiants", href: "https://www.canva.com/fr_fr/cv/" },
    ] as QuickLink[],
  },
  // ÉTAPE 8 — Soutien & aide humaine
  {
    step: 8,
    title: "Soutien",
    subtitle: "Aide alimentaire, psycho & juridique",
    icon: HeartHandshake,
    accentClass: "bg-destructive/10 text-destructive",
    className: "",
    lockable: true,
    links: [
      { icon: Utensils, label: "Agoraé — Épicerie solidaire campus", sub: "Surveille les mails @univ-grenoble-alpes.fr pour les distribs", href: `https://maps.google.com/?q=Agoraé+campus+Grenoble` },
      { icon: Utensils, label: "Restos du Cœur", sub: "Sidi Brahim, Grenoble", href: `https://maps.google.com/?q=Restos+du+Coeur+Sidi+Brahim+Grenoble` },
      { icon: HandCoins, label: "Aide d'urgence ASAP (CROUS)", sub: "RDV assistante sociale • 351 allée Berlioz", href: "https://www.etudiant.gouv.fr/fr/aides-specifiques-702" },
      { icon: Phone, label: "CROUS — Assistante sociale", sub: "04 76 57 44 00 • 351 allée Berlioz", href: "tel:+33476574400" },
      { icon: Brain, label: "Fil Santé Jeunes", sub: "0 800 235 236 — Anonyme & gratuit", href: "tel:0800235236" },
      { icon: Scale, label: "Aide juridique gratuite", sub: "CDAD — accès au droit pour étudiants", href: "https://www.justice.fr/themes/acces-droit" },
      { icon: Globe, label: "Pass'Culture — Clé de déchiffrage", sub: "Spectacles à 5€ • Espace culturel campus", href: `https://maps.google.com/?q=Espace+culturel+campus+Grenoble` },
    ] as QuickLink[],
  },
];

/** Enrich tiles with Perplexity city data */
function enrichTilesWithCityData(tiles: ReturnType<typeof defaultTiles>, cityData: any) {
  if (!cityData || cityData.parse_error) return tiles;

  return tiles.map((t) => {

    // Logement : résidences CROUS + plateformes locales de la ville
    if (t.title === "Logement") {
      const logLinks: QuickLink[] = [];
      if (cityData.logement?.residences_crous?.length) {
        cityData.logement.residences_crous.forEach((r: any) => {
          logLinks.push({
            icon: Building2,
            label: r.name,
            sub: r.address || undefined,
            href: r.url || `https://maps.google.com/?q=${encodeURIComponent(r.name)}`,
            perplexity: true,
          });
        });
      }
      if (cityData.logement?.autres?.length) {
        cityData.logement.autres.slice(0, 2).forEach((p: string) => {
          logLinks.push({ icon: Globe, label: p, sub: "Plateforme locale recommandée", perplexity: true });
        });
      }
      if (logLinks.length) {
        return { ...t, links: [...logLinks, ...t.links.filter(l => !l.perplexity)] };
      }
      return t;
    }

    // Préfecture : données officielles de la ville
    if (t.title === "Préfecture" && cityData.prefecture) {
      const pref = cityData.prefecture;
      const prefLinks: QuickLink[] = [];
      if (pref.name || pref.address) {
        prefLinks.push({
          icon: MapPin,
          label: pref.name || "Préfecture",
          sub: pref.address || undefined,
          href: pref.address ? `https://maps.google.com/?q=${encodeURIComponent(pref.address)}` : undefined,
          perplexity: true,
        });
      }
      if (pref.phone) {
        prefLinks.push({
          icon: Phone,
          label: pref.phone,
          sub: "Appeler la préfecture",
          href: `tel:${pref.phone.replace(/\s/g, "")}`,
          perplexity: true,
        });
      }
      if (pref.rdv_url) {
        prefLinks.push({
          icon: ExternalLink,
          label: "Prendre RDV en ligne",
          sub: "Titre de séjour étudiant",
          href: pref.rdv_url,
          perplexity: true,
        });
      }
      if (prefLinks.length) return { ...t, links: prefLinks };
      return t;
    }

    // Aides & Administratif : CROUS + CAF locaux
    if (t.title === "Aides & Administratif") {
      const adminLinks: QuickLink[] = [];
      if (cityData.crous?.url) {
        adminLinks.push({
          icon: Building2,
          label: cityData.crous.name || "CROUS local",
          sub: cityData.crous.address,
          href: cityData.crous.url,
          perplexity: true,
        });
      }
      if (cityData.caf) {
        adminLinks.push({
          icon: Home,
          label: "CAF locale",
          sub: cityData.caf.address || "Aide au logement",
          href: cityData.caf.url || "https://www.caf.fr",
          perplexity: true,
        });
      }
      if (cityData.crous?.resto_u?.length) {
        cityData.crous.resto_u.slice(0, 1).forEach((r: any) => {
          adminLinks.push({
            icon: Utensils,
            label: r.name,
            sub: r.address,
            href: r.url || `https://maps.google.com/?q=${encodeURIComponent(r.name + " " + r.address)}`,
            perplexity: true,
          });
        });
      }
      if (adminLinks.length) {
        return { ...t, links: [...adminLinks, ...t.links.filter(l => !l.perplexity)] };
      }
      return t;
    }

    // Banque : liste officielle + conseil
    if (t.title === "Banque" && cityData.banques) {
      const bankLinks: QuickLink[] = [];
      if (cityData.banques.liste?.length) {
        cityData.banques.liste.forEach((b: any) => {
          bankLinks.push({
            icon: Landmark,
            label: b.name,
            sub: b.student_offer || undefined,
            href: b.link || undefined,
            perplexity: true,
          });
        });
      }
      if (bankLinks.length) {
        return { ...t, links: bankLinks, _conseil: cityData.banques.conseil } as any;
      }
      return t;
    }

    // Santé : centre universitaire + SOS Médecins
    if (t.title === "Santé" && cityData.health) {
      const healthLinks: QuickLink[] = [];
      if (cityData.health.university_health_center?.name) {
        healthLinks.push({
          icon: Stethoscope,
          label: cityData.health.university_health_center.name,
          sub: cityData.health.university_health_center.address,
          href: cityData.health.university_health_center.phone
            ? `tel:${cityData.health.university_health_center.phone.replace(/\s/g, "")}`
            : undefined,
          perplexity: true,
        });
      }
      if (cityData.health.sos_medecins?.phone) {
        healthLinks.push({
          icon: Phone,
          label: "SOS Médecins",
          sub: cityData.health.sos_medecins.phone,
          href: `tel:${cityData.health.sos_medecins.phone.replace(/\s/g, "")}`,
          perplexity: true,
        });
      }
      return { ...t, links: [...healthLinks, ...t.links.filter(l => !l.perplexity)] };
    }

    // Vie pratique : transport de la ville
    if (t.title === "Vie pratique" && cityData.transport) {
      const transportLink: QuickLink = {
        icon: Bus,
        label: `${cityData.transport.network_name} — Abo étudiant`,
        sub: cityData.transport.student_subscription,
        href: cityData.transport.url,
        perplexity: true,
      };
      return { ...t, links: [transportLink, ...t.links.filter(l => !l.perplexity)] };
    }

    return t;
  });
}

/* ─── Main grid ─── */
const BentoGrid = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInFrance, isFrench, isTemoin } = useIntegration();
  const [city, setCity] = useState<string>("Grenoble");
  const [verifyOpen, setVerifyOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles_public")
      .select("city, target_city")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.city) setCity(data.city);
        else if (data?.target_city) setCity(data.target_city);
      });
  }, [user]);

  const { data: cityData, loading: cityLoading } = useCityResources(city);

  // Non-verified users can now READ everything — only actions are locked
  const isReadOnly = !isTemoin && !isFrench;

  const baseTiles = defaultTiles(city);
  const tiles = cityData ? enrichTilesWithCityData(baseTiles, cityData) : baseTiles;

  return (
    <div>
      {/* City indicator */}
      {cityLoading && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Chargement des ressources pour <strong>{city}</strong>…</span>
        </div>
      )}
      {cityData && !cityData.parse_error && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Ressources personnalisées pour <strong className="text-foreground">{city}</strong></span>
        </div>
      )}

      {/* Read-only banner for non-verified users */}
      {isReadOnly && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <p className="flex-1 text-xs text-primary/80">
            <span className="font-semibold text-primary">Mode lecture</span> — Vérifie ton email étudiant pour cocher tes démarches et accéder à toutes les fonctionnalités.
          </p>
          <button
            onClick={() => setVerifyOpen(true)}
            className="shrink-0 rounded-full gold-gradient px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            Vérifier
          </button>
        </motion.div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {tiles.map((t) => (
          <BentoTile
            key={t.title}
            title={t.title}
            subtitle={t.subtitle}
            icon={t.icon}
            accentClass={t.accentClass}
            links={t.links}
            className=""
            locked={false}
            onNavigate={navigate}
            onUnlock={() => setVerifyOpen(true)}
            conseil={(t as any)._conseil}
            alerte={(t as any)._alerte}
            step={t.step}
          />
        ))}
      </motion.div>

      {/* Tips from Perplexity */}
      {cityData?.useful_tips && cityData.useful_tips.length > 0 && (
        <div className="mt-4 rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Conseils pour {city}</h4>
          </div>
          <ul className="space-y-2">
            {cityData.useful_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 text-primary font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <VerificationDialog open={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </div>
  );
};

export default BentoGrid;

