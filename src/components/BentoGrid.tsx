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
import { useActiveCities } from "@/hooks/useActiveCities";
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
  "Ton spot 🏡": "Logement & Installation",
  "Mode légal activé ⚖️": "Titre de séjour",
  "Zéro galère admin 📂": "CAF, bourses & aides",
  "Cash flow mode 💸": "Ouvrir un compte",
  "100% couvert 🛡️": "Mutuelle & santé",
  "Life unlocked 🔓": "Vie quotidienne",
  "Level up ta carrière 🚀": "Jobs & carrière",
  "On est là pour toi 🤝": "Aide sociale",
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

            {/* Bannière partenaires — Spot logement */}
            {title === "Ton spot 🏡" && !locked && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                <span className="text-sm">🤝</span>
                <p className="text-xs text-primary/80 leading-snug">
                  <span className="font-semibold text-primary">Plateformes partenaires et offres exclusives</span> arrivent bientôt ⚡
                </p>
              </div>
            )}

            {/* Bannière partenaires — Cash flow (Banque) */}
            {title === "Cash flow mode 💸" && !locked && (
              <button
                onClick={() => onNavigate("/partners")}
                className="mx-6 mb-4 flex w-[calc(100%-3rem)] items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-left transition-colors hover:bg-primary/10 cursor-pointer"
              >
                <span className="text-sm">🎁</span>
                <p className="flex-1 text-xs text-primary/80 leading-snug">
                  <span className="font-semibold text-primary">Bons plans & offres partenaires</span> — comptes étudiants, promos exclusives ⚡
                </p>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              </button>
            )}

            {/* Bannière partenaires — 100% couvert (Santé) */}
            {title === "100% couvert 🛡️" && !locked && (
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

            {/* Bannière partenaires — Level up carrière */}
            {title === "Level up ta carrière 🚀" && !locked && (
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
    title: "Ton spot 🏡",
    subtitle: "Trouver un logement • CROUS & plateformes",
    icon: Home,
    accentClass: "bg-warning/15 text-warning",
    className: "",
    lockable: true,
    _alerte: city.toLowerCase() === "grenoble"
      ? "⚠️ Renouvellement CROUS 2026 : du 10 mars au 4 mai. Sur messervices.etudiant.gouv.fr → Cité'U → Grenoble → « Mon logement actuel » → « Demander mon renouvellement ». Passé le 4 mai = perte de ta chambre pour la rentrée."
      : city.toLowerCase() === "lyon"
        ? "⚠️ Lyon est en zone tendue. DSE à faire entre mars et le 31 mai (même sans confirmation d'admission). Pense à la Caution Visale (garant gratuit de l'État)."
        : city.toLowerCase() === "montpellier"
          ? "⚠️ Montpellier : transports gratuits pour les résidents de la Métropole ! Fais ton Pass Gratuité dès ton arrivée (pièce d'identité + justificatif de domicile)."
          : city.toLowerCase() === "toulouse"
            ? "⚠️ Toulouse : Instal'Toit = prêt 0% jusqu'à 500€ pour les 18-29 ans locataires depuis moins de 3 mois. Pense aussi à Visale (garant gratuit)."
              : city.toLowerCase() === "clermont-ferrand"
               ? "⚠️ Clermont-Ferrand : loyer moyen ~366€ (une des villes les moins chères). Pense au DSE + Lokaviz + Espace Info Jeunes pour des offres gratuites toute l'année."
               : city.toLowerCase() === "bordeaux"
                 ? "⚠️ Bordeaux : Studapart est partenaire officiel de l'Université de Bordeaux. Pense aussi au Centre Logement de la Ville (05 24 57 16 96) et à Visale (garant gratuit)."
                 : city.toLowerCase() === "marseille"
                   ? "⚠️ Marseille : hébergement d'urgence étudiant disponible (logement temporaire sans loyer, avec suivi social). Contacte le CROUS Aix-Marseille."
                    : city.toLowerCase() === "nantes"
                      ? "⚠️ Nantes : Le Fonds d'Aide aux Jeunes (FAJ) peut accorder jusqu'à 1 600€/an pour logement, santé, transport. Contacte la Métropole ou ton assistante sociale CROUS."
                        : city.toLowerCase() === "strasbourg"
                          ? "⚠️ Strasbourg : le dispositif 'Strasbourg aime ses étudiants' centralise toutes les aides logement. Le FAJ peut accorder jusqu'à 1 800€/an. Profite aussi de Kehl (Allemagne) à 10 min en tram pour tes courses."
                          : city.toLowerCase() === "rennes"
                            ? "⚠️ Rennes accueille 63 000 étudiants. Des épiceries gratuites fonctionnent sur les campus Villejean et Beaulieu. Le prêt étudiant garanti par l'État (jusqu'à 20 000€ sans caution) est accessible via le CROUS."
                            : undefined,
    links: [
      { icon: Building2, label: "Résidences CROUS", sub: "Dossier social étudiant (DSE)", href: "https://www.messervices.etudiant.gouv.fr" },
      { icon: Globe, label: "Lokaviz CROUS", sub: "Logements chez l'habitant", href: "https://www.lokaviz.fr" },
      { icon: Home, label: "Simulateur APL (CAF)", sub: "Calcule ton aide au logement en 2 min", href: "https://www.caf.fr/allocataires/mes-services-en-ligne/faire-une-simulation" },
      { icon: Globe, label: "SeLoger Étudiant", sub: "Colocations et studios", href: "https://www.seloger.com" },
    ] as QuickLink[],
  },
  // ÉTAPE 2 — Titre de séjour & préfecture
  {
    step: 2,
    title: "Mode légal activé ⚖️",
    subtitle: "Être en règle • Titre de séjour & ANEF",
    icon: Landmark,
    accentClass: "bg-info/15 text-info",
    className: "",
    lockable: true,
    links: [
      { icon: Globe, label: "Portail ANEF — VLS-TS en ligne", sub: "Validation du titre de séjour • 75 €", href: "https://administration-etrangers-en-france.interieur.gouv.fr/" },
      ...(city.toLowerCase() === "grenoble"
        ? [
            { icon: MapPin as React.ElementType, label: "Bâtiment MUSE (antenne campus)", sub: "80 allée Ampère, Domaine Universitaire • ex-ISSO", href: "https://maps.google.com/?q=Bâtiment+MUSE+80+allée+Ampère+Grenoble" },
            { icon: MapPin as React.ElementType, label: "Préfecture de l'Isère", sub: "Place de Verdun, Grenoble • retrait carte de séjour", href: "https://maps.google.com/?q=Préfecture+Isère+Place+de+Verdun+Grenoble" },
          ]
        : city.toLowerCase() === "lyon"
          ? [
              { icon: MapPin as React.ElementType, label: "Préfecture du Rhône", sub: "106 rue Pierre Corneille, 69003 Lyon", href: "https://maps.google.com/?q=Préfecture+Rhône+106+rue+Pierre+Corneille+Lyon" },
              { icon: MapPin as React.ElementType, label: "Students Welcome Desk", sub: "Guichet unique étudiants internationaux — chaque rentrée", href: "https://www.lyoncampus.com/etudier/etudiants-internationaux" },
            ]
          : city.toLowerCase() === "montpellier"
            ? [
                { icon: MapPin as React.ElementType, label: "Préfecture de l'Hérault", sub: "34 place des Martyrs de la Résistance, 34000 Montpellier", href: "https://maps.google.com/?q=Préfecture+Hérault+34+place+Martyrs+Résistance+Montpellier" },
                { icon: MapPin as React.ElementType, label: "Espace Montpellier Jeunesse", sub: "1 place Francis Ponge • Emploi, logement, orientation 12-29 ans", href: "https://maps.google.com/?q=Espace+Montpellier+Jeunesse+1+place+Francis+Ponge" },
              ]
            : city.toLowerCase() === "toulouse"
              ? [
                  { icon: MapPin as React.ElementType, label: "Préfecture de Haute-Garonne", sub: "1 place Saint-Étienne, 31038 Toulouse", href: "https://maps.google.com/?q=Préfecture+Haute-Garonne+1+place+Saint-Étienne+Toulouse" },
                  { icon: MapPin as React.ElementType, label: "Welcome Desk Toulouse", sub: "Guichet unique étudiants internationaux — chaque rentrée", href: "https://metropole.toulouse.fr" },
                ]
               : city.toLowerCase() === "clermont-ferrand"
                ? [
                    { icon: MapPin as React.ElementType, label: "Préfecture du Puy-de-Dôme", sub: "18 bd Desaix, 63000 Clermont-Ferrand", href: "https://maps.google.com/?q=Préfecture+Puy-de-Dôme+18+boulevard+Desaix+Clermont-Ferrand" },
                    { icon: MapPin as React.ElementType, label: "Welcome Clermont", sub: "Guide d'installation pour étudiants et nouveaux arrivants", href: "https://welcomeclermont.com/etudiants-francais/" },
                  ]
                   : city.toLowerCase() === "marseille"
                   ? [
                       { icon: MapPin as React.ElementType, label: "Préfecture des Bouches-du-Rhône", sub: "Place Félix Baret, 13282 Marseille", href: "https://maps.google.com/?q=Préfecture+Bouches-du-Rhône+Place+Félix+Baret+Marseille" },
                       { icon: MapPin as React.ElementType, label: "Maison de l'Étudiant", sub: "96 La Canebière, 13001 Marseille • Info, accompagnement, événements", href: "https://maps.google.com/?q=Maison+de+l+Étudiant+96+La+Canebière+Marseille" },
                     ]
                    : city.toLowerCase() === "bordeaux"
                      ? [
                          { icon: MapPin as React.ElementType, label: "Préfecture de la Gironde", sub: "2 esplanade Charles de Gaulle, 33000 Bordeaux", href: "https://maps.google.com/?q=Préfecture+Gironde+2+esplanade+Charles+de+Gaulle+Bordeaux" },
                          { icon: Globe as React.ElementType, label: "Bordeaux accueille ses étudiants", sub: "Événement annuel d'accueil — forum, visites, spectacles", href: "https://www.bordeaux.fr/les-18-25-ans" },
                        ]
                       : city.toLowerCase() === "nantes"
                         ? [
                             { icon: MapPin as React.ElementType, label: "Préfecture de Loire-Atlantique", sub: "6 quai Ceineray, 44035 Nantes", href: "https://maps.google.com/?q=Préfecture+Loire-Atlantique+6+quai+Ceineray+Nantes" },
                             { icon: Globe as React.ElementType, label: "Pépinières Jeunesse Nantes", sub: "Accompagnement projets 16-25 ans — info, orientation, réseau", href: "https://metropole.nantes.fr/jeunesse" },
                           ]
                         : city.toLowerCase() === "lille"
                           ? [
                               { icon: MapPin as React.ElementType, label: "Préfecture du Nord", sub: "12 rue Jean sans Peur, 59039 Lille", href: "https://maps.google.com/?q=Préfecture+du+Nord+12+rue+Jean+sans+Peur+Lille" },
                               { icon: Globe as React.ElementType, label: "CRIJ Hauts-de-France", sub: "2 rue Édouard Delesalle — emploi, logement, orientation", href: "https://www.crij-hdf.fr" },
                              ]
                            : city.toLowerCase() === "strasbourg"
                              ? [
                                  { icon: MapPin as React.ElementType, label: "Préfecture du Bas-Rhin", sub: "5 place de la République, 67000 Strasbourg", href: "https://maps.google.com/?q=Préfecture+Bas-Rhin+5+place+de+la+République+Strasbourg" },
                                   { icon: Globe as React.ElementType, label: "Strasbourg aime ses étudiants", sub: "Aides, logement, transport, santé, culture — tout en un", href: "https://www.strasbourgaimesesetudiants.eu/les-aides" },
                                 ]
                               : city.toLowerCase() === "rennes"
                                 ? [
                                     { icon: MapPin as React.ElementType, label: "Préfecture d'Ille-et-Vilaine", sub: "3 avenue de la Préfecture, 35000 Rennes", href: "https://maps.google.com/?q=Préfecture+Ille-et-Vilaine+3+avenue+Préfecture+Rennes" },
                                     { icon: Globe as React.ElementType, label: "Le 4 bis — Info Jeunes Rennes", sub: "2 cours des Alliés • Info gratuite 16-30 ans, sans RDV", href: "https://education-jeunesse.metropole.rennes.fr/jeunes-ou-trouver-de-laide/" },
                                   ]
                               : [
                         { icon: MapPin as React.ElementType, label: `Préfecture de ${city}`, sub: `Retrait carte de séjour — ${city}`, href: `https://maps.google.com/?q=Préfecture+${encodeURIComponent(city)}` },
                       ]
      ),
    ] as QuickLink[],
  },
  // ÉTAPE 3 — Aides financières & administratif
  {
    step: 3,
    title: "Zéro galère admin 📂",
    subtitle: "Simplifier les démarches • CAF, bourses & fac",
    icon: ClipboardCheck,
    accentClass: "gold-gradient text-primary-foreground",
    className: "",
    lockable: true,
    links: [
      { icon: ClipboardCheck, label: "Check-list administrative", sub: "Visa, CAF, Sécu, banque — tout en un", route: "/mon-dossier" },
      { icon: HandCoins, label: "Bourse CROUS (DSE)", sub: "Demande en ligne — deadline octobre", href: "https://www.messervices.etudiant.gouv.fr/envole/" },
      ...(city.toLowerCase() === "lyon"
        ? [{ icon: GraduationCap as React.ElementType, label: "LyonCampus — Mode d'emploi", sub: "Le guide complet pour étudier à Lyon", href: "https://www.lyoncampus.com/etudier/etudier-a-lyon-mode-demploi" }]
        : city.toLowerCase() === "montpellier"
          ? [{ icon: GraduationCap as React.ElementType, label: "Montpellier — Études & orientation", sub: "Maison des Relations Internationales, échanges étudiants", href: "https://www.montpellier.fr/actions/competences/jeunesse" }]
           : city.toLowerCase() === "toulouse"
            ? [{ icon: GraduationCap as React.ElementType, label: "Guide Jeunes Toulouse 2025-2026", sub: "Logement, santé, transport, emploi, culture — tout en un", href: "https://metropole.toulouse.fr/sites/toulouse-fr/files/2025-08/20250725_toulouse_guidejeunes_interieur-web_2.pdf" }]
             : city.toLowerCase() === "clermont-ferrand"
               ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Clermont Auvergne", sub: "Bourses, logements, restauration, aides financières", href: "https://www.crous-clermont.fr" }]
                : city.toLowerCase() === "marseille"
                 ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Aix-Marseille Avignon", sub: "Bourses, logements, restauration, aides", href: "https://www.crous-aix-marseille.fr" }]
                  : city.toLowerCase() === "bordeaux"
                    ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Bordeaux-Aquitaine", sub: "Bourses, logements, restauration, aides", href: "https://www.crous-bordeaux.fr" }]
                     : city.toLowerCase() === "nantes"
                       ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Nantes - Pays de la Loire", sub: "Bourses, logements, restauration, aides", href: "https://www.crous-nantes.fr" }]
                        : city.toLowerCase() === "lille"
                          ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Lille Nord-Pas-de-Calais", sub: "Bourses, logements, restauration, aides", href: "https://www.crous-lille.fr" }]
                           : city.toLowerCase() === "strasbourg"
                             ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Strasbourg", sub: "Bourses, logements, restauration, aides", href: "https://www.crous-strasbourg.fr" }]
                             : city.toLowerCase() === "rennes"
                               ? [{ icon: GraduationCap as React.ElementType, label: "CROUS Rennes Bretagne", sub: "Bourses, logements, restauration, DSE", href: "https://www.crous-rennes.fr" }]
                               : [{ icon: GraduationCap as React.ElementType, label: "Inscription universitaire", sub: "Portail d'arrivée à l'UGA", href: "https://etudiant.univ-grenoble-alpes.fr/quotidien/arriver-a-l-uga/votre-arrivee-a-l-universite-grenoble-alpes-1458048.kjsp" }]
      ),
    ] as QuickLink[],
  },
  // ÉTAPE 4 — Banque
  {
    step: 4,
    title: "Cash flow mode 💸",
    subtitle: "Ouvrir un compte étudiant en France",
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
      { icon: ClipboardCheck, label: "Voir les banques partenaires", sub: "Comptes étudiants & offres exclusives", route: "/partners" },
    ] as QuickLink[],
  },
  // ÉTAPE 5 — Santé
  {
    step: 5,
    title: "100% couvert 🛡️",
    subtitle: "Soins, urgences & bien-être étudiant",
    icon: Stethoscope,
    accentClass: "bg-destructive/15 text-destructive",
    className: "",
    lockable: true,
    links: [
      { icon: Stethoscope, label: "Médecins secteur 1", sub: "Sans avance de frais — Annuaire Ameli", href: "https://annuairesante.ameli.fr/" },
      ...(city.toLowerCase() === "grenoble"
        ? [{ icon: MapPin as React.ElementType, label: "Centre de Santé Étudiant — MUSE", sub: "80 allée Ampère, St-Martin-d'Hères • Secteur 1, sans avance de frais", href: "https://maps.google.com/?q=Bâtiment+MUSE+80+allée+Ampère+Saint-Martin-d%27Hères" }]
        : city.toLowerCase() === "lyon"
          ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante Lyon", sub: "Campus La Doua, Villeurbanne • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+La+Doua+Villeurbanne" }]
            : city.toLowerCase() === "montpellier"
              ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante Montpellier", sub: "Campus Triolet • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+Campus+Triolet+Montpellier" }]
              : city.toLowerCase() === "toulouse"
                ? [{ icon: MapPin as React.ElementType, label: "SIMPPS Toulouse", sub: "Campus Paul Sabatier • Consultations gratuites", href: "https://maps.google.com/?q=SIMPPS+Campus+Paul+Sabatier+Toulouse" }]
                : city.toLowerCase() === "clermont-ferrand"
                  ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante UCA", sub: "Campus des Cézeaux, Aubière • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+Campus+Cézeaux+Aubière" }]
                   : city.toLowerCase() === "marseille"
                     ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante AMU", sub: "Campus Saint-Charles • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+Campus+Saint-Charles+Marseille" }]
                      : city.toLowerCase() === "bordeaux"
                        ? [{ icon: MapPin as React.ElementType, label: "Espace Santé Étudiants Bordeaux", sub: "Campus Talence • Soins sans avance de frais, psychologues", href: "https://maps.google.com/?q=Espace+santé+étudiants+Talence+Bordeaux" }]
                         : city.toLowerCase() === "nantes"
                           ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante Nantes", sub: "Campus Tertre • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+Campus+Tertre+Nantes" }]
                            : city.toLowerCase() === "lille"
                              ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante Lille", sub: "Campus Cité Scientifique • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+Cité+Scientifique+Villeneuve+d+Ascq" }]
                              : city.toLowerCase() === "strasbourg"
                                ? [{ icon: MapPin as React.ElementType, label: "SSE — Santé Étudiante Unistra", sub: "6 rue de Palerme • Consultations gratuites", href: "https://maps.google.com/?q=Service+santé+étudiante+6+rue+de+Palerme+Strasbourg" }]
                                : [{ icon: MapPin as React.ElementType, label: "Centre de santé universitaire", sub: `Campus de ${city} — Service de santé étudiante`, href: `https://maps.google.com/?q=Service+sant%C3%A9+%C3%A9tudiants+${encodeURIComponent(city)}` }]
      ),
      { icon: Phone, label: "SAMU — 15", sub: "Urgences médicales 24h/24", href: "tel:15" },
      ...(city.toLowerCase() === "lyon"
        ? [{ icon: Heart as React.ElementType, label: "Nightline Lyon", sub: "Écoute étudiante gratuite 21h-2h", href: "https://www.nightline.fr/" }]
        : city.toLowerCase() === "montpellier"
          ? [{ icon: Heart as React.ElementType, label: "Nightline Montpellier", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
           : city.toLowerCase() === "toulouse"
            ? [{ icon: Heart as React.ElementType, label: "Nightline Toulouse", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
             : city.toLowerCase() === "clermont-ferrand"
               ? [{ icon: Heart as React.ElementType, label: "Nightline Clermont", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
               : city.toLowerCase() === "marseille"
                 ? [{ icon: Heart as React.ElementType, label: "Nightline Aix-Marseille", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
                  : city.toLowerCase() === "bordeaux"
                    ? [{ icon: Heart as React.ElementType, label: "Nightline Bordeaux", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
                     : city.toLowerCase() === "nantes"
                       ? [{ icon: Heart as React.ElementType, label: "Nightline Nantes", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
                        : city.toLowerCase() === "lille"
                          ? [{ icon: Heart as React.ElementType, label: "Nightline Lille", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
                          : city.toLowerCase() === "strasbourg"
                            ? [{ icon: Heart as React.ElementType, label: "Nightline Strasbourg", sub: "Écoute étudiante gratuite le soir", href: "https://www.nightline.fr/" }]
                            : [{ icon: Heart as React.ElementType, label: "Nightline France", sub: "Écoute psy gratuite entre étudiants", href: "https://www.nightline.fr/" }]
      ),
    ] as QuickLink[],
  },
  // ÉTAPE 6 — Vie pratique
  {
    step: 6,
    title: "Life unlocked 🔓",
    subtitle: "Transport, repas à 1€ & sport campus",
    icon: Bus,
    accentClass: "bg-success/15 text-success",
    className: "",
    lockable: true,
    links: [
      ...(city.toLowerCase() === "lyon"
        ? [
            { icon: Bus as React.ElementType, label: "TCL — Abo étudiant", sub: "~25€/mois • Gratuité pour boursiers échelon 7", href: "https://www.tcl.fr" },
          ]
        : city.toLowerCase() === "montpellier"
          ? [
              { icon: Bus as React.ElementType, label: "TaM — Transports GRATUITS", sub: "Pass Gratuité pour résidents de la Métropole • Appli M'Ticket", href: "https://www.tam-voyages.com" },
            ]
           : city.toLowerCase() === "toulouse"
            ? [
                { icon: Bus as React.ElementType, label: "Tisséo — Carte Pastel", sub: "Tarif réduit -26 ans • Métro 5h-minuit (3h jeu-sam)", href: "https://www.tisseo.fr" },
                { icon: Globe as React.ElementType, label: "VélôToulouse", sub: "2600 vélos, 1ère demi-heure gratuite, abo 1,66€/an", href: "https://www.velouse.toulouse.fr" },
              ]
             : city.toLowerCase() === "clermont-ferrand"
               ? [
                   { icon: Bus as React.ElementType, label: "T2C — Abo étudiant", sub: "~24€/mois • Tarif solidaire pour boursiers", href: "https://www.t2c.fr" },
                   { icon: Globe as React.ElementType, label: "C.Vélo — Vélos en location", sub: "Trajets courts, formule accessible étudiants", href: "https://www.c-velo.fr" },
                 ]
                  : city.toLowerCase() === "marseille"
                   ? [
                       { icon: Bus as React.ElementType, label: "RTM — Abo Jeune -26 ans", sub: "~33€/mois • Métro, tramway, bus", href: "https://www.rtm.fr" },
                       { icon: Globe as React.ElementType, label: "Le Vélo — Vélos en libre-service", sub: "Stations dans tout Marseille", href: "https://www.levelo-mpm.fr" },
                     ]
                    : city.toLowerCase() === "bordeaux"
                      ? [
                          { icon: Bus as React.ElementType, label: "TBM — Pass Jeune", sub: "Tarif réduit tram, bus, Bat3 pour -26 ans", href: "https://www.infotbm.com" },
                          { icon: Globe as React.ElementType, label: "TBM Vélos", sub: "Prêt et location longue durée vélos électriques", href: "https://www.infotbm.com/fr/se-deplacer/velo.html" },
                          { icon: Globe as React.ElementType, label: "Covoiturage Karos", sub: "Covoiturage domicile-campus via appli", href: "https://www.karos.fr" },
                        ]
                       : city.toLowerCase() === "nantes"
                         ? [
                             { icon: Bus as React.ElementType, label: "TAN — Abo étudiant", sub: "~30€/mois • Tram, bus, Busway", href: "https://www.tan.fr" },
                             { icon: Globe as React.ElementType, label: "Bicloo — Vélos en libre-service", sub: "Stations dans toute la métropole nantaise", href: "https://metropole.nantes.fr/deplacements/velo/bicloo" },
                           ]
                         : city.toLowerCase() === "lille"
                           ? [
                               { icon: Bus as React.ElementType, label: "Ilévia — Abo étudiant", sub: "~30€/mois • Métro, tramway, bus", href: "https://www.ilevia.fr" },
                               { icon: Globe as React.ElementType, label: "V'Lille — Vélos en libre-service", sub: "Stations dans toute la métropole lilloise", href: "https://www.ilevia.fr/vlille" },
                              ]
                            : city.toLowerCase() === "strasbourg"
                              ? [
                                  { icon: Bus as React.ElementType, label: "CTS — Abo étudiant", sub: "~27€/mois • Tram + Bus", href: "https://www.cts-strasbourg.eu" },
                                  { icon: Globe as React.ElementType, label: "Vélhop — Vélos en libre-service", sub: "Location courte et longue durée dans Strasbourg", href: "https://velhop.strasbourg.eu" },
                                ]
                              : [
                  { icon: Bus as React.ElementType, label: "M réso — Abo étudiant solidaire", sub: "Tarif réduit selon QF CAF • Agences Gare & Grand'Place", href: "https://www.reso-m.fr/68-tarification-solidaire.htm" },
                  { icon: Globe as React.ElementType, label: "M vélo+ — Vélos en location", sub: "Tarif réduit sur présentation QF CAF • Agences Gare & MUSE", href: "https://www.veloplus-m.fr" },
                ]
      ),
      { icon: Utensils, label: "Repas à 1€ CROUS", sub: "Tous les restos U à tarif solidaire", href: "https://www.lescrous.fr/2025/09/comment-beneficier-du-repas-crous-a-1e/" },
      ...(city.toLowerCase() === "grenoble"
        ? [
            { icon: Dumbbell as React.ElementType, label: "Sport universitaire (ETC Sport)", sub: "50+ activités — crédits ECTS possibles", href: "https://www.univ-grenoble-alpes.fr/formation/enrichir-son-parcours/personnaliser-votre-formation/les-etc-de-sport/les-enseignements-transversaux-a-choix-etc-de-sport-723373.kjsp" },
            { icon: Phone as React.ElementType, label: "Ticket SMS dépannage", sub: "SMS au 93123 — achète un ticket de bus sans appli", href: "sms:93123" },
          ]
        : city.toLowerCase() === "lyon"
          ? [
              { icon: Dumbbell as React.ElementType, label: "Pass'Sport — 50€", sub: "Aide de l'État pour licence sportive ou salle de sport", href: "https://www.pass.sports.gouv.fr/" },
              { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
            ]
          : city.toLowerCase() === "montpellier"
            ? [
                { icon: Dumbbell as React.ElementType, label: "Coup de Pouce Jeune — 50-75€", sub: "Aide sport/culture dans une association montpelliéraine", href: "https://www.montpellier.fr/actions/competences/jeunesse/dispositifs-de-soutien-la-jeunesse" },
                { icon: Globe as React.ElementType, label: "Carte Été Jeunes — 25€", sub: "Activités gratuites du 15 juin au 15 sept (musée Fabre, MO.CO., piscines…)", href: "https://www.montpellier.fr/actions/competences/jeunesse/dispositifs-de-soutien-la-jeunesse/carte-ete-jeunes" },
                { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
              ]
            : city.toLowerCase() === "toulouse"
              ? [
                  { icon: Globe as React.ElementType, label: "Pass Toulouse+", sub: "Réductions culture & loisirs pendant 1 an", href: "https://metropole.toulouse.fr/actualites/nos-bons-plans-pour-un-quotidien-plus-facile" },
                  { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                ]
                 : city.toLowerCase() === "clermont-ferrand"
                   ? [
                       { icon: Globe as React.ElementType, label: "Carte Cité Jeune — Gratuite", sub: "Réductions culture, festivals, théâtres pour -27 ans", href: "https://clermont-ferrand.fr/etudiants" },
                       { icon: Globe as React.ElementType, label: "Carte Si T Jeune — Gratuite", sub: "Cinémas, concerts, musées pour 12-27 ans", href: "https://clermont-ferrand.fr/etudiants" },
                       { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                     ]
                     : city.toLowerCase() === "marseille"
                      ? [
                          { icon: Utensils as React.ElementType, label: "Repas offerts RU Canebière", sub: "Mardis soirs d'octobre à décembre — gratuit", href: "https://www.crous-aix-marseille.fr/restauration/" },
                          { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                          { icon: Globe as React.ElementType, label: "Pass'Culture", sub: "300€ de budget culture pour les 18 ans et +", href: "https://pass.culture.fr/" },
                        ]
                      : city.toLowerCase() === "bordeaux"
                        ? [
                            { icon: Globe as React.ElementType, label: "Carte Jeune Bordeaux — Gratuite", sub: "250+ réductions culture, sport, loisirs pour 0-25 ans", href: "https://www.bordeaux.fr/carte-jeune-un-passeport-pour-des-reductions-et-bons-plans" },
                            { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                            { icon: Dumbbell as React.ElementType, label: "Sport universitaire Bordeaux", sub: "Activités sportives campus Pessac-Talence", href: "https://www.u-bordeaux.fr/campus/sport" },
                          ]
                         : city.toLowerCase() === "nantes"
                           ? [
                               { icon: Globe as React.ElementType, label: "Cart'S Atelier des Initiatives", sub: "Réductions sorties culturelles pour étudiants nantais", href: "https://metropole.nantes.fr/jeunesse" },
                               { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                               { icon: Globe as React.ElementType, label: "Pass Nantado", sub: "Propositions culturelles adaptées 11-15 ans", href: "https://metropole.nantes.fr/jeunesse" },
                             ]
                           : city.toLowerCase() === "lille"
                             ? [
                                 { icon: Globe as React.ElementType, label: "Carte Blanche — Loisirs & sport", sub: "Réductions cinémas, musées, piscines, théâtres dans la MEL", href: "https://www.lillemetropole.fr/votre-quotidien/sport-et-loisirs" },
                                 { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                                 { icon: Dumbbell as React.ElementType, label: "Sport universitaire Lille", sub: "Activités sportives campus Cité Scientifique", href: "https://www.univ-lille.fr/vie-des-campus/sport" },
                                ]
                              : city.toLowerCase() === "strasbourg"
                                ? [
                                    { icon: Globe as React.ElementType, label: "Carte Culture Strasbourg", sub: "Accès réduit musées, spectacles, cinémas pour étudiants", href: "https://www.strasbourgaimesesetudiants.eu/les-aides" },
                                    { icon: Globe as React.ElementType, label: "App Izly", sub: "Indispensable pour payer au RU et repas à 1€", href: "https://www.izly.fr/" },
                                    { icon: Dumbbell as React.ElementType, label: "Sport universitaire Unistra", sub: "Activités sportives campus Esplanade", href: "https://suaps.unistra.fr" },
                                  ]
                                : [
                   { icon: Dumbbell as React.ElementType, label: "Sport universitaire", sub: "Activités sportives campus", href: `https://maps.google.com/?q=sport+universitaire+${encodeURIComponent(city)}` },
                 ]
      ),
    ] as QuickLink[],
  },
  // ÉTAPE 7 — Carrière & avenir
  {
    step: 7,
    title: "Level up ta carrière 🚀",
    subtitle: "Jobs, stages & orientation professionnelle",
    icon: Briefcase,
    accentClass: "bg-info/15 text-info",
    className: "",
    lockable: true,
    links: [
      ...(city.toLowerCase() === "lyon"
        ? [{ icon: MapPin as React.ElementType, label: "Orientation — Universités de Lyon", sub: "Réorientation, coaching, forums à la MDE", href: "https://www.lyoncampus.com" }]
        : city.toLowerCase() === "montpellier"
          ? [
              { icon: MapPin as React.ElementType, label: "Espace Montpellier Jeunesse", sub: "Emploi, stages, BAFA, permis, ateliers CV — 12-29 ans", href: "https://www.montpellier.fr/actions/competences/jeunesse" },
              { icon: MapPin as React.ElementType, label: "Mission Locale Montpellier", sub: "Accompagnement 16-25 ans sortis du système scolaire", href: "https://www.montpellier.fr/vie-quotidienne/vivre-ici/trouver-un-emploi" },
            ]
           : city.toLowerCase() === "toulouse"
            ? [
                { icon: MapPin as React.ElementType, label: "Info Jeunes Toulouse", sub: "17 rue de Metz • Ateliers CV, job dating, orientation", href: "https://maps.google.com/?q=Info+Jeunes+Toulouse+17+rue+de+Metz" },
                { icon: MapPin as React.ElementType, label: "LIJ Soupetard — Accompagnement", sub: "CV, Parcoursup, orientation, stages, Mission Locale", href: "https://maps.google.com/?q=LIJ+Soupetard+Toulouse" },
              ]
             : city.toLowerCase() === "clermont-ferrand"
               ? [
                   { icon: MapPin as React.ElementType, label: "Espace Info Jeunes Clermont", sub: "Accompagnement emploi, logement, orientation", href: "https://clermont-ferrand.fr/etudiants" },
                   { icon: Globe as React.ElementType, label: "Welcome Clermont — Emploi & stages", sub: "Guide emploi, alternance, vie étudiante", href: "https://welcomeclermont.com/etudiants-francais/" },
                 ]
               : city.toLowerCase() === "marseille"
                 ? [
                     { icon: MapPin as React.ElementType, label: "Maison de l'Étudiant Marseille", sub: "96 La Canebière • Info, stages, accompagnement", href: "https://maps.google.com/?q=Maison+de+l+Étudiant+96+La+Canebière+Marseille" },
                     { icon: Globe as React.ElementType, label: "Sortie d'Amphi Marseille", sub: "Actions gratuites de la Ville pour les étudiants", href: "https://www.marseille.fr/education/marseille-ville-universitaire" },
                   ]
                  : city.toLowerCase() === "bordeaux"
                    ? [
                        { icon: MapPin as React.ElementType, label: "CRIJ Nouvelle-Aquitaine", sub: "125 cours Alsace-Lorraine • Emploi, orientation, mobilité", href: "https://maps.google.com/?q=CRIJ+Nouvelle-Aquitaine+125+cours+Alsace-Lorraine+Bordeaux" },
                        { icon: Globe as React.ElementType, label: "Fédération Aliénor", sub: "Associations étudiantes de Bordeaux et Aquitaine", href: "https://www.bordeaux.fr/les-18-25-ans" },
                      ]
                     : city.toLowerCase() === "nantes"
                       ? [
                           { icon: MapPin as React.ElementType, label: "Jeunesse Nantaise en Action", sub: "Info, orientation, accès aux droits, solidarité — 15-30 ans", href: "https://metropole.nantes.fr/mes-services-mon-quotidien/espace-associations-nantaises/annuaire-des-associations-nantaises/jeunesse-nantaise-en-action" },
                           { icon: Globe as React.ElementType, label: "Boussole des Jeunes Nantes", sub: "Outil numérique pour trouver emploi, formation, aides", href: "https://boussole-des-jeunes.com" },
                         ]
                       : city.toLowerCase() === "lille"
                         ? [
                             { icon: MapPin as React.ElementType, label: "CRIJ Hauts-de-France", sub: "2 rue Édouard Delesalle • Emploi, orientation, mobilité", href: "https://maps.google.com/?q=CRIJ+Hauts-de-France+2+rue+Édouard+Delesalle+Lille" },
                             { icon: Globe as React.ElementType, label: "RIJ Vieux-Lille", sub: "Offres emploi, baby-sitting, animation — tous les jours 14h-17h", href: "https://www.lille.fr/Vivre-a-Lille/Jeunesse" },
                            ]
                          : city.toLowerCase() === "strasbourg"
                            ? [
                                { icon: MapPin as React.ElementType, label: "Mission Locale Strasbourg", sub: "Accompagnement emploi, formation, insertion 16-25 ans", href: "https://www.mlpe.eu" },
                                { icon: Globe as React.ElementType, label: "Unistra — Espace Avenir", sub: "Orientation, stages, emploi, réorientation", href: "https://www.unistra.fr/formation/orientation-et-insertion" },
                              ]
                     : [{ icon: MapPin as React.ElementType, label: "Espace OIP — Orientation & Insertion", sub: "Campus UGA • Réorientation, CV, emploi", href: "https://etudiant.univ-grenoble-alpes.fr/l-espace-orientation-et-insertion-professionnelle-de-l-universite-grenoble-alpes-1379827.kjsp" }]
      ),
      { icon: Briefcase, label: "Jobs étudiants — Jobaviz", sub: "Offres vérifiées CROUS • 20h/sem max", href: "https://www.jobaviz.fr/" },
      { icon: GraduationCap, label: "Stages & alternance", sub: "1jeune1solution — offres nationales", href: "https://www.1jeune1solution.gouv.fr/" },
      { icon: Globe, label: "France Travail", sub: "Accompagnement et offres d'emploi", href: "https://www.francetravail.fr/" },
      { icon: FileText, label: "Rédiger son CV", sub: "Modèles gratuits adaptés aux étudiants", href: "https://www.canva.com/fr_fr/cv/" },
    ] as QuickLink[],
  },
  // ÉTAPE 8 — Soutien & aide humaine
  {
    step: 8,
    title: "On est là pour toi 🤝",
    subtitle: "Aide alimentaire, soutien psycho & juridique",
    icon: HeartHandshake,
    accentClass: "bg-destructive/10 text-destructive",
    className: "",
    lockable: true,
    links: [
      ...(city.toLowerCase() === "lyon"
        ? [
            { icon: Utensils as React.ElementType, label: "AGORAé Lyon — Épicerie solidaire", sub: "Campus La Doua & Lyon 2 • Produits à 10% du prix", href: "https://www.fage.org/innovation-sociale/agorae/" },
            { icon: Utensils as React.ElementType, label: "Restos du Cœur", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
            { icon: HandCoins as React.ElementType, label: "RSJ — Revenu Solidarité Jeunes", sub: "Aide Métropole de Lyon pour 18-24 ans sans ressources", href: "https://www.grandlyon.com" },
            { icon: HandCoins as React.ElementType, label: "Aides CROUS Lyon", sub: "Aides spécifiques & financières", href: "https://www.crous-lyon.fr" },
            { icon: MapPin as React.ElementType, label: "MDE — Maison des Étudiants", sub: "90 rue de Marseille, Lyon 7e • 400 événements/an", href: "https://maps.google.com/?q=Maison+des+étudiants+90+rue+de+Marseille+Lyon" },
            { icon: Globe as React.ElementType, label: "ESN Cosmo Lyon", sub: "Accompagnement étudiants internationaux & Buddy System", href: "https://www.lyoncampus.com/etudier/etudiants-internationaux" },
          ]
        : city.toLowerCase() === "montpellier"
          ? [
              { icon: Utensils as React.ElementType, label: "Repas CROUS à 1€", sub: "RU Triolet, Vert-Bois, Richter — App Izly obligatoire", href: "https://www.crous-montpellier.fr/restauration/" },
              { icon: Utensils as React.ElementType, label: "Restos du Cœur", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
              { icon: HandCoins as React.ElementType, label: "Bourse Initiatives Jeunes", sub: "Aide pour projets culturels, sociaux, sportifs, humanitaires", href: "https://www.montpellier.fr/actions/competences/jeunesse/dispositifs-de-soutien-la-jeunesse" },
              { icon: HandCoins as React.ElementType, label: "Aides CROUS Montpellier", sub: "Aides spécifiques & financières", href: "https://www.crous-montpellier.fr" },
              { icon: Home as React.ElementType, label: "Boutique Logement Jeunes", sub: "Accompagnement gratuit 18-30 ans : logement, aides, propriétaires", href: "https://www.montpellier.fr/actions/competences/jeunesse/dispositifs-de-soutien-la-jeunesse/aide-au-logement-pour-les-etudiants" },
              { icon: Globe as React.ElementType, label: "Maison Relations Internationales", sub: "Nelson Mandela • Échanges, bourses mobilité 500€", href: "https://www.montpellier.fr/actions/competences/action-internationale/programmes-dechanges-etudiants" },
            ]
           : city.toLowerCase() === "toulouse"
            ? [
                { icon: Utensils as React.ElementType, label: "Restos du Cœur Toulouse", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                { icon: HandCoins as React.ElementType, label: "Fonds d'Aide aux Jeunes (FAJ)", sub: "Aide exceptionnelle étudiants en précarité — via assistante sociale CROUS", href: "https://www.crous-toulouse.fr" },
                { icon: HandCoins as React.ElementType, label: "Instal'Toit — Prêt 0%", sub: "Jusqu'à 500€ pour les 18-29 ans, remboursable sur 2 ans", href: "https://metropole.toulouse.fr" },
                { icon: HandCoins as React.ElementType, label: "Aides CROUS Toulouse", sub: "Aides spécifiques & financières", href: "https://www.crous-toulouse.fr" },
                { icon: Globe as React.ElementType, label: "Espace Diversités Laïcité", sub: "Droits humains, égalité, accueil LGBT+, événements", href: "https://maps.google.com/?q=Espace+Diversités+Laïcité+Toulouse" },
              ]
             : city.toLowerCase() === "clermont-ferrand"
               ? [
                   { icon: Utensils as React.ElementType, label: "Restos du Cœur Clermont", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                   { icon: HandCoins as React.ElementType, label: "Aides CROUS Clermont Auvergne", sub: "Aides spécifiques & financières", href: "https://www.crous-clermont.fr" },
                   { icon: MapPin as React.ElementType, label: "Espace Info Jeunes", sub: "Offres logement gratuites, accompagnement jeunes", href: "https://clermont-ferrand.fr/se-loger" },
                   { icon: Globe as React.ElementType, label: "Service Université Culture", sub: "Ateliers arts plastiques, danse, théâtre — gratuit/pas cher", href: "https://clermont-ferrand.fr/etudiants" },
                 ]
               : city.toLowerCase() === "marseille"
                 ? [
                     { icon: Utensils as React.ElementType, label: "Repas offerts CROUS Marseille", sub: "RU Canebière, Saint-Charles, Luminy — repas gratuits ponctuels", href: "https://www.crous-aix-marseille.fr/restauration/" },
                     { icon: Utensils as React.ElementType, label: "Restos du Cœur Marseille", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                     { icon: HandCoins as React.ElementType, label: "Aides CROUS Aix-Marseille", sub: "Aides spécifiques & financières", href: "https://www.crous-aix-marseille.fr" },
                     { icon: Home as React.ElementType, label: "Hébergement d'urgence étudiant", sub: "Logement temporaire sans loyer, avec suivi social", href: "https://www.marseille.fr/education/marseille-ville-universitaire" },
                     { icon: Globe as React.ElementType, label: "App Le Dégaine", sub: "Recense toutes les aides sociales et financières étudiantes", href: "https://www.marseille.fr/education/marseille-ville-universitaire" },
                     { icon: Globe as React.ElementType, label: "Service Respect Égalité AMU", sub: "Lutte contre violences sexistes, accompagnement victimes", href: "https://www.univ-amu.fr" },
                   ]
                  : city.toLowerCase() === "bordeaux"
                    ? [
                        { icon: Utensils as React.ElementType, label: "Restos du Cœur Bordeaux", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                        { icon: HandCoins as React.ElementType, label: "Aides CROUS Bordeaux", sub: "Aides spécifiques & financières", href: "https://www.crous-bordeaux.fr" },
                        { icon: Home as React.ElementType, label: "Vivre Avec — Habitat intergénérationnel", sub: "Logement solidaire étudiants-seniors à Bordeaux", href: "https://www.bordeaux.fr/jeunes-adultes-a-bordeaux-nos-conseils-pour-bien-commencer" },
                        { icon: Globe as React.ElementType, label: "Opération Angela", sub: "Refuge dans commerces partenaires en cas d'insécurité", href: "https://www.bordeaux.fr/jeunes-adultes-a-bordeaux-nos-conseils-pour-bien-commencer" },
                      ]
                     : city.toLowerCase() === "nantes"
                       ? [
                           { icon: Utensils as React.ElementType, label: "Restos du Cœur Nantes", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                           { icon: HandCoins as React.ElementType, label: "Fonds d'Aide aux Jeunes (FAJ)", sub: "Jusqu'à 1 600€/an pour 16-25 ans — logement, santé, transport", href: "https://metropole.nantes.fr/mes-services-mon-quotidien/aides-et-bons-plans/le-fonds-d-aide-aux-jeunes" },
                           { icon: HandCoins as React.ElementType, label: "Aides CROUS Nantes", sub: "Aides spécifiques & financières", href: "https://www.crous-nantes.fr" },
                           { icon: Globe as React.ElementType, label: "Maison de l'Habitant", sub: "Point ressource logement et accompagnement", href: "https://metropole.nantes.fr/lieu/la-maison-de-l-habitant" },
                           { icon: Globe as React.ElementType, label: "Aides vacances ANCV/Soléo", sub: "Bourse vacances pour 16-25 ans aux revenus limités", href: "https://metropole.nantes.fr/mes-services-mon-quotidien-aides-et-bons-plans/les-aides-au-depart-en-vacances-pour-les-16-25-ans" },
                         ]
                       : city.toLowerCase() === "lille"
                         ? [
                             { icon: Utensils as React.ElementType, label: "Restos du Cœur Lille", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                             { icon: HandCoins as React.ElementType, label: "Aides CROUS Lille", sub: "Aides spécifiques & financières", href: "https://www.crous-lille.fr" },
                             { icon: Globe as React.ElementType, label: "MEL — Stratégie Jeunesse #JeM2.0", sub: "Solidarité, émancipation, engagement pour les jeunes", href: "https://www.lillemetropole.fr/votre-mel/competences/jeunesse" },
                             { icon: Globe as React.ElementType, label: "Action Logement Lille", sub: "Aide au dépôt de garantie et prise en charge partielle du loyer", href: "https://www.actionlogement.fr" },
                            ]
                          : city.toLowerCase() === "strasbourg"
                            ? [
                                { icon: Utensils as React.ElementType, label: "Agoraé Strasbourg — Épicerie solidaire", sub: "Colis alimentaires étudiants en difficulté", href: "https://www.strasbourgaimesesetudiants.eu/les-aides" },
                                { icon: Utensils as React.ElementType, label: "Restos du Cœur Strasbourg", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                                { icon: HandCoins as React.ElementType, label: "FAJ Eurométropole — jusqu'à 1 800€", sub: "Fonds d'aide aux jeunes 16-25 ans en difficulté", href: "https://www.strasbourg.eu/fond-aide-jeunes" },
                                { icon: HandCoins as React.ElementType, label: "Aides CROUS Strasbourg", sub: "Aides spécifiques & financières", href: "https://www.crous-strasbourg.fr" },
                                { icon: Globe as React.ElementType, label: "Bourses Fondation Unistra", sub: "Bourses de donateurs pour logement, alimentation, santé", href: "https://www.unistra.fr/fr/campus/aide-sociale-et-solidaire/financements-et-aides-materielles" },
                              ]
                      : [
                        { icon: Utensils as React.ElementType, label: "Agoraé — Épicerie solidaire campus", sub: "Colis alimentaires pour étudiants en difficulté", href: "https://colibri.univ-grenoble-alpes.fr/actualites/agorae-un-magasin-solidaire-pour-les-etudiants-707583.kjsp" },
                        { icon: Utensils as React.ElementType, label: "Restos du Cœur", sub: "Aide alimentaire gratuite sur dossier", href: "https://www.restosducoeur.org/trouver-centre/" },
                        { icon: HandCoins as React.ElementType, label: "Autres aides CROUS", sub: "Aides spécifiques & financières", href: "https://www.crous-grenoble.fr/bourses-et-aides-financieres/ai-je-droit-a-dautres-aides/" },
                        { icon: Phone as React.ElementType, label: "CROUS — Assistante sociale", sub: "Aide sociale & financière d'urgence", href: "https://www.crous-grenoble.fr/vie-etudiante/sante-social/service-social/" },
                      ]
      ),
      { icon: Brain, label: "Fil Santé Jeunes", sub: "0 800 235 236 — Anonyme & gratuit 24h/24", href: "tel:+33800235236" },
      { icon: Brain, label: "Nightline France — écoute étudiante", sub: "Ligne d'écoute tenue par des étudiants", href: "https://www.nightline.fr/" },
      ...(city.toLowerCase() === "lyon"
        ? [
            { icon: Globe as React.ElementType, label: "Culture Campus", sub: "Spectacles à ~4,50€ — Point de vente à la MDE", href: "https://www.lyoncampus.com" },
          ]
        : city.toLowerCase() === "montpellier"
          ? [
              { icon: Globe as React.ElementType, label: "Bons plans culture CROUS", sub: "Billetterie, sport gratuit, ateliers artistiques", href: "https://www.crous-montpellier.fr" },
            ]
           : city.toLowerCase() === "toulouse"
            ? [
                { icon: Globe as React.ElementType, label: "Saisons Étudiantes Toulouse", sub: "Musées gratuits 6-15 mars + automne • Spectacles & expos", href: "https://metropole.toulouse.fr/actualites/les-rendez-vous-etudiants-culture" },
                { icon: Globe as React.ElementType, label: "Pause Musicale", sub: "Concerts gratuits le jeudi à 12h30 — Salle du Sénéchal", href: "https://metropole.toulouse.fr/sortir/culture-et-loisirs/bons-plans-culturels" },
              ]
             : city.toLowerCase() === "clermont-ferrand"
               ? [
                   { icon: Globe as React.ElementType, label: "Clermont fête ses étudiants", sub: "Événement d'intégration annuel — soirées gratuites à la rentrée", href: "https://clermont-ferrand.fr/etudiants" },
                 ]
               : city.toLowerCase() === "marseille"
                 ? [
                     { icon: Globe as React.ElementType, label: "Nuit des Étudiants du Monde", sub: "Grand événement d'accueil à Marseille chaque rentrée", href: "https://www.marseille.fr/education/marseille-ville-universitaire" },
                     { icon: Globe as React.ElementType, label: "Cohabilis — Habitat solidaire", sub: "Cohabitation intergénérationnelle étudiants-seniors", href: "https://www.cohabilis.org" },
                   ]
                  : city.toLowerCase() === "bordeaux"
                    ? [
                        { icon: Globe as React.ElementType, label: "Bordeaux accueille ses étudiants", sub: "Événement annuel gratuit — Opéra, forum, visites, spectacles", href: "https://www.bordeaux.fr/les-18-25-ans" },
                        { icon: Globe as React.ElementType, label: "Carte Jeune Bordeaux", sub: "250+ réductions culture, sport, loisirs — gratuite 0-25 ans", href: "https://www.bordeaux.fr/carte-jeune-un-passeport-pour-des-reductions-et-bons-plans" },
                      ]
                     : city.toLowerCase() === "nantes"
                       ? [
                           { icon: Globe as React.ElementType, label: "Bouger en Europe — Nantes", sub: "Mobilité 16-22 ans, séjours et projets européens financés", href: "https://metropole.nantes.fr/actualites/un-dispositif-jeunesse-pour-bouger-en-europe" },
                           { icon: Globe as React.ElementType, label: "CLAP — Comité Local Aide aux Projets", sub: "Soutien aux initiatives jeunesse à Nantes", href: "https://metropole.nantes.fr/jeunesse" },
                         ]
                       : city.toLowerCase() === "lille"
                         ? [
                             { icon: Globe as React.ElementType, label: "Agenda des Ados — Lille", sub: "Bons plans loisirs, culture, sport — médiathèques, musées, piscines", href: "https://www.lille.fr/Vivre-a-Lille/Jeunesse" },
                             { icon: Globe as React.ElementType, label: "Carte Blanche MEL", sub: "Réductions cinémas, musées, piscines, patinoires, théâtres", href: "https://www.lillemetropole.fr/votre-quotidien/sport-et-loisirs" },
                            ]
                          : city.toLowerCase() === "strasbourg"
                            ? [
                                { icon: Globe as React.ElementType, label: "Welcome Days Unistra", sub: "Événement de rentrée — stands info, sport, culture, bons plans", href: "https://www.strasbourg.eu/etudiants" },
                                { icon: Globe as React.ElementType, label: "Kehl (Allemagne) à 10 min", sub: "Courses alimentaires moins chères juste de l'autre côté du Rhin", href: "https://maps.google.com/?q=Kehl+Allemagne" },
                              ]
                      : [
                         { icon: Scale as React.ElementType, label: "Aide juridique gratuite", sub: "Consultations gratuites d'avocat — Cour d'appel Grenoble", href: "https://www.cours-appel.justice.fr/grenoble/consultations-gratuites-davocat" },
                      ]
      ),
      { icon: Globe, label: "Pass'Culture", sub: "300€ de budget culture pour les 18 ans et +", href: "https://pass.culture.fr/" },
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

// Cities coming soon (purely decorative, no Perplexity call)
const COMING_SOON_CITIES = [
  { name: "Paris", emoji: "🗼", label: "Île-de-France" },
  { name: "Nice", emoji: "🌊", label: "Côte d'Azur" },
];

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

  // Villes actives avec ressources IA disponibles (depuis feature_flags)
  const { activeCities } = useActiveCities();
  const isActiveCity = activeCities.includes(city.toLowerCase().trim());

  // On n'appelle Perplexity que pour les villes actives
  const { data: cityData, loading: cityLoading } = useCityResources(isActiveCity ? city : null);

  // Non-verified users can now READ everything — only actions are locked
  const isReadOnly = !isTemoin && !isFrench;

  const baseTiles = defaultTiles(city);
  const tiles = cityData ? enrichTilesWithCityData(baseTiles, cityData) : baseTiles;

  // Pour les villes non-actives : afficher un état "coming soon" sans aucune donnée Grenoble
  if (!isActiveCity) {
    return (
      <div>
        {/* Bandeau ville non-active */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-4 rounded-3xl border border-primary/25 bg-primary/5 px-5 py-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gold-gradient">
            <Globe className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {city} — ressources bientôt disponibles ⚡
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Les ressources locales pour <strong>{city}</strong> seront activées prochainement. Tu seras parmi les premiers informés.
            </p>
          </div>
        </motion.div>

        {/* Tuiles verrouillées — aucun lien spécifique à Grenoble affiché */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {defaultTiles(city).map((t) => (
            <motion.div key={t.title} variants={tile} className="relative overflow-hidden rounded-4xl border border-border bg-card">
              {/* Overlay coming soon */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-4xl bg-background/70 backdrop-blur-[2px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold text-foreground">Bientôt disponible</p>
                <p className="text-[11px] text-muted-foreground">{city} — en cours de déploiement</p>
              </div>
              {/* Contenu fantôme (non interactif) */}
              <div className="flex items-center gap-3 p-6 opacity-30 pointer-events-none select-none">
                {t.step !== undefined && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {t.step}
                  </span>
                )}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.accentClass}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">{t.title}</h3>
                  <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Coming soon cities */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Autres villes — bientôt disponibles</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COMING_SOON_CITIES.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-secondary/30 px-3 py-2.5 opacity-60"
              >
                <span className="text-base">{c.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  Bientôt
                </span>
              </div>
            ))}
          </div>
        </div>

        <VerificationDialog open={verifyOpen} onClose={() => setVerifyOpen(false)} />
      </div>
    );
  }

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
          <span>Ressources à jour pour <strong className="text-foreground">{city}</strong></span>
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
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary">Mode lecture activé 👀</p>
            <p className="text-xs text-primary/70">Vérifie ton email étudiant pour tout débloquer.</p>
          </div>
          <button
            onClick={() => setVerifyOpen(true)}
            className="shrink-0 rounded-full gold-gradient px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            Let's go 🔓
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

      {/* Coming soon cities */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Autres villes — bientôt disponibles</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COMING_SOON_CITIES.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-secondary/30 px-3 py-2.5 opacity-60"
            >
              <span className="text-base">{c.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.label}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                Bientôt
              </span>
            </div>
          ))}
        </div>
      </div>

      <VerificationDialog open={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </div>
  );
};

export default BentoGrid;


