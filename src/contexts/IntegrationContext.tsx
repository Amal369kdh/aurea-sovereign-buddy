import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChecklistGuide {
  steps: string[];
  documents?: string[];
  deadline?: string;
  pitfalls?: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  hasAya?: boolean;
  scope?: "pre" | "post";
  link?: string;
  tip?: string;
  guide?: ChecklistGuide;
  /** true = visible but not interactable (preview for not-in-france users or non-temoin) */
  locked?: boolean;
}

export interface ChecklistPhase {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
  scope?: "pre" | "post";
  /** true = this phase is shown as preview only */
  locked?: boolean;
}

interface IntegrationState {
  phases: ChecklistPhase[];
  progress: number;
  isInFrance: boolean | null;
  isFrench: boolean;
  isTemoin: boolean;
  toggleTask: (phaseId: string, itemId: string) => void;
  setIsInFrance: (value: boolean) => void;
  refreshProfile: () => Promise<void>;
}

const allPhases: ChecklistPhase[] = [
  {
    id: "pre-arrival",
    title: "Pré-arrivée",
    icon: "✈️",
    scope: "pre",
    items: [
      {
        id: "visa", label: "Demande de visa étudiant", done: false, hasAya: true,
        link: "https://france-visas.gouv.fr/",
        tip: "Commence la demande au moins 3 mois avant ton départ.",
        guide: {
          steps: [
            "Crée un compte sur france-visas.gouv.fr",
            "Remplis le formulaire de demande de visa long séjour étudiant (VLS-TS)",
            "Rassemble tous les documents requis",
            "Prends RDV au consulat/centre VFS de ton pays",
            "Présente-toi au RDV avec le dossier complet + frais de visa (99 €)",
            "Attends la réponse (2 à 6 semaines selon le pays)",
          ],
          documents: ["Passeport valide (6 mois minimum)", "Attestation d'inscription ou pré-inscription", "Justificatif de ressources (615 €/mois minimum)", "Attestation d'hébergement ou réservation", "Assurance santé couvrant le séjour", "Photos d'identité aux normes", "Formulaire OFII complété"],
          deadline: "3 mois avant le départ — les délais consulaires varient selon le pays",
          pitfalls: ["Ne pas confondre visa court séjour et VLS-TS", "Vérifier que le passeport expire APRÈS la fin du visa", "Les traductions assermentées peuvent prendre 2 semaines", "Certains consulats imposent un passage Campus France AVANT le dépôt"],
        },
      },
      {
        id: "campus-france", label: "Procédure Campus France", done: false,
        link: "https://www.campusfrance.org/",
        tip: "Crée ton dossier sur Études en France et suis les étapes.",
        guide: {
          steps: [
            "Crée un compte sur etudes-en-france.campusfrance.org",
            "Remplis ton dossier pédagogique (parcours, motivations)",
            "Saisis tes vœux d'établissements (jusqu'à 7)",
            "Paye les frais de dossier Campus France",
            "Passe l'entretien Campus France (en ligne ou en présentiel)",
            "Attends les réponses des établissements",
          ],
          documents: ["Relevés de notes des 3 dernières années", "Diplômes obtenus (+ traductions)", "CV à jour", "Lettres de motivation par vœu", "Justificatif de niveau de français (TCF/DELF B2 minimum)"],
          deadline: "Décembre–mars selon les pays — vérifie le calendrier de ton espace Campus France",
          pitfalls: ["L'entretien évalue ta motivation, pas tes notes", "Les frais Campus France ne sont PAS remboursables", "Certains pays ont des quotas — dépose tôt"],
        },
      },
      {
        id: "avi", label: "Assurance voyage internationale", done: false,
        link: "https://www.acs-ami.com/",
        tip: "Obligatoire pour le visa — vérifie les montants de couverture.",
        guide: {
          steps: [
            "Compare les offres (ACS, Chapka, Globe PVT, MGEN)",
            "Vérifie que la couverture inclut : hospitalisation (30 000 € min), rapatriement, responsabilité civile",
            "Souscris en ligne — tu recevras l'attestation par email",
            "Imprime l'attestation pour le dossier visa",
          ],
          documents: ["Passeport", "Dates exactes de voyage"],
          deadline: "Avant le dépôt du dossier visa",
          pitfalls: ["L'assurance voyage ne remplace PAS la Sécurité sociale étudiante", "Vérifie la durée de couverture — elle doit couvrir toute la période du visa", "Certains consulats exigent un montant minimum de couverture"],
        },
      },
      {
        id: "logement-anticipe", label: "Réserver un logement depuis l'étranger", done: false,
        link: "https://trouverunlogement.lescrous.fr/",
        tip: "CROUS, Studapart ou résidence étudiante — réserve tôt.",
        guide: {
          steps: [
            "Dépose un dossier sur trouverunlogement.lescrous.fr (résidences CROUS)",
            "En parallèle, cherche sur Studapart, Lokaviz, ou le site de ton université",
            "Prépare un garant (ou utilise Visale — garantie gratuite de l'État)",
            "Signe le bail à distance si possible (signature électronique)",
            "Prévois un hébergement temporaire pour les premiers jours (auberge, Airbnb)",
          ],
          documents: ["Attestation d'inscription", "Pièce d'identité", "Garantie Visale ou garant physique", "RIB (même étranger)"],
          deadline: "Dès l'admission — les résidences CROUS se remplissent en juillet",
          pitfalls: ["Ne JAMAIS envoyer d'argent sans avoir vu le bail officiel (arnaques fréquentes)", "Visale est gratuit et accepté par 100% des bailleurs — utilise-le", "Le dépôt de garantie ne peut pas dépasser 1 mois de loyer hors charges"],
        },
      },
    ],
  },
  {
    id: "installation",
    title: "Installation",
    icon: "🏠",
    scope: "post",
    items: [
      {
        id: "logement", label: "Trouver un logement", done: false, hasAya: true,
        link: "https://trouverunlogement.lescrous.fr/",
        tip: "CROUS, Studapart, LeBonCoin — commence par les résidences universitaires.",
        guide: {
          steps: [
            "Cherche d'abord les résidences CROUS (loyer modéré, APL automatique)",
            "Étudie les annonces sur LeBonCoin, PAP, SeLoger (coloc possible)",
            "Visite le logement AVANT de signer (ou fais visiter par un ami sur place)",
            "Demande la garantie Visale sur visale.fr AVANT de signer le bail",
            "Signe le bail et fais l'état des lieux d'entrée (prends des photos)",
            "Souscris une assurance habitation le jour même",
          ],
          documents: ["Pièce d'identité / passeport", "Visa ou titre de séjour", "Attestation Visale ou garant", "3 derniers relevés bancaires", "Attestation d'inscription universitaire"],
          deadline: "Dès que possible après l'arrivée — idéalement avant",
          pitfalls: ["Ne JAMAIS payer avant d'avoir le bail signé", "Les frais d'agence sont plafonnés par la loi (max 12 €/m²)", "Photographier chaque défaut à l'état des lieux d'entrée", "La caution ne peut dépasser 1 mois de loyer (loi ALUR)"],
        },
      },
      {
        id: "electricite", label: "Ouverture électricité / gaz", done: false, hasAya: true,
        link: "https://www.edf.fr/",
        tip: "Appelle EDF ou Engie avec ton contrat de bail.",
        guide: {
          steps: [
            "Récupère le numéro PDL (point de livraison) sur le compteur ou le bail",
            "Appelle EDF (09 69 32 15 15) ou souscris en ligne sur edf.fr",
            "Choisis le tarif réglementé (le plus simple pour commencer)",
            "L'ouverture se fait sous 24-48h en général",
          ],
          documents: ["Contrat de bail ou attestation d'hébergement", "RIB pour le prélèvement", "Relevé du compteur (index)"],
          deadline: "Le jour de l'emménagement",
          pitfalls: ["Sans ouverture de compteur, pas d'électricité — fais-le avant d'emménager si possible", "Le tarif réglementé est souvent le moins cher pour les petits logements"],
        },
      },
      {
        id: "banque", label: "Ouverture de compte bancaire", done: false,
        link: "https://www.boursobank.com/",
        tip: "Banque en ligne (Bourso, Revolut) ou agence — apporte ton passeport et justificatif de domicile.",
        guide: {
          steps: [
            "Choisis entre banque traditionnelle (BNP, Société Générale) ou en ligne (Bourso, Revolut)",
            "Prends RDV en agence ou inscris-toi en ligne",
            "Fournis les documents demandés",
            "Tu recevras ton RIB immédiatement, la carte en 5-10 jours",
          ],
          documents: ["Passeport ou carte d'identité", "Justificatif de domicile de moins de 3 mois", "Attestation d'inscription universitaire", "Visa ou titre de séjour"],
          deadline: "Première semaine en France — indispensable pour la CAF, le loyer, etc.",
          pitfalls: ["Certaines banques en ligne refusent les non-résidents fiscaux français au début", "Le RIB français est obligatoire pour recevoir les aides (APL, bourse)", "Évite les découverts — les frais sont élevés en France"],
        },
      },
      {
        id: "telephone", label: "Forfait téléphone français", done: false,
        link: "https://www.free.fr/forfait-mobile/",
        tip: "Free Mobile à 2 € ou 19,99 € — sans engagement, idéal pour commencer.",
        guide: {
          steps: [
            "Va dans une boutique Free, SFR, Orange ou Bouygues avec ton passeport",
            "Choisis un forfait sans engagement (Free 2€ ou 19,99€ recommandé)",
            "Active la carte SIM dans ton téléphone",
            "Tu auras un numéro français immédiatement",
          ],
          documents: ["Passeport ou pièce d'identité", "RIB français (ou carte bancaire pour le premier paiement)"],
          deadline: "Dès l'arrivée — un numéro français est demandé partout",
          pitfalls: ["Vérifie que ton téléphone est débloqué (désimlocké)", "Le forfait à 2€ de Free inclut 2h d'appels — suffisant pour commencer"],
        },
      },
      {
        id: "assurance-habitation", label: "Assurance habitation", done: false,
        link: "https://www.heyme.care/",
        tip: "Obligatoire pour le bail — HEYME, LMDE ou MAIF proposent des offres étudiantes.",
        guide: {
          steps: [
            "Compare les offres étudiantes (HEYME ~3,50€/mois, LMDE, MAIF)",
            "Souscris en ligne — c'est instantané",
            "Télécharge l'attestation et remets-la à ton propriétaire",
          ],
          documents: ["Adresse du logement", "Surface en m²", "RIB ou carte bancaire"],
          deadline: "OBLIGATOIRE le jour de la signature du bail — le propriétaire peut résilier sans",
          pitfalls: ["C'est une obligation légale — le propriétaire peut résilier le bail si tu n'en as pas", "Vérifie que la responsabilité civile est incluse (c'est le cas chez HEYME)"],
        },
      },
    ],
  },
  {
    id: "legal",
    title: "Démarches légales",
    icon: "⚖️",
    scope: "post",
    items: [
      {
        id: "vls-ts", label: "Validation du VLS-TS (titre de séjour)", done: false, hasAya: true,
        link: "https://administration-etrangers-en-france.interieur.gouv.fr/",
        tip: "À faire dans les 3 premiers mois après ton arrivée — paiement de 75 €.",
        guide: {
          steps: [
            "Va sur administration-etrangers-en-france.interieur.gouv.fr",
            "Crée un compte et choisis « Valider mon VLS-TS »",
            "Renseigne ta date d'arrivée en France et ton adresse",
            "Paye le timbre fiscal de 75 € (par carte bancaire en ligne)",
            "Télécharge la confirmation de validation",
            "Conserve précieusement cette confirmation — c'est ton titre de séjour",
          ],
          documents: ["Passeport avec le visa VLS-TS", "Adresse en France", "Carte bancaire pour le paiement de 75 €"],
          deadline: "IMPÉRATIF : dans les 3 premiers mois après l'arrivée en France",
          pitfalls: ["Si tu dépasses les 3 mois, tu seras en situation irrégulière", "Le timbre fiscal de 75 € n'est PAS remboursable", "Garde une copie numérique de la confirmation sur ton téléphone"],
        },
      },
      {
        id: "secu", label: "Numéro de Sécurité Sociale", done: false, hasAya: true,
        link: "https://etudiant-etranger.ameli.fr/",
        tip: "Inscris-toi en ligne sur ameli.fr — prévoir 2 à 4 semaines.",
        guide: {
          steps: [
            "Va sur etudiant-etranger.ameli.fr",
            "Remplis le formulaire d'inscription en ligne",
            "Téléverse les documents demandés",
            "Attends la réception de ton numéro provisoire par email (2-4 semaines)",
            "Ta carte Vitale arrivera par courrier (1-3 mois)",
            "En attendant, utilise l'attestation provisoire pour tes consultations",
          ],
          documents: ["Passeport", "Visa VLS-TS validé", "Acte de naissance (traduit et apostillé si nécessaire)", "Attestation d'inscription universitaire", "RIB français", "Justificatif de domicile"],
          deadline: "Dès l'arrivée — la couverture est rétroactive à la date d'inscription",
          pitfalls: ["L'inscription est GRATUITE — ne paye jamais un intermédiaire", "Tu es couvert dès l'inscription, même sans carte Vitale", "Demande une attestation provisoire sur ameli.fr si tu as besoin de consulter"],
        },
      },
    ],
  },
  {
    id: "vie-locale",
    title: "Vie quotidienne",
    icon: "🌍",
    scope: "post",
    items: [
      {
        id: "caf", label: "Demande d'aide au logement (CAF)", done: false, hasAya: true,
        link: "https://www.caf.fr/allocataires/mes-services-en-ligne/faire-une-simulation",
        tip: "Simule ton APL en ligne puis fais la demande — ça peut réduire ton loyer de 100 à 300 €.",
        guide: {
          steps: [
            "Fais d'abord une simulation sur caf.fr pour estimer ton APL",
            "Crée un compte sur caf.fr avec ton numéro de Sécurité Sociale",
            "Remplis la demande d'aide au logement en ligne",
            "Ton propriétaire devra aussi renseigner ses infos sur le site",
            "L'APL est versée à partir du mois suivant la demande (pas de rétroactivité)",
          ],
          documents: ["Numéro de Sécurité Sociale", "Contrat de bail", "RIB français", "Montant du loyer et des charges", "Revenus (0 € si tu viens d'arriver — c'est normal)"],
          deadline: "Dès que tu as ton numéro de Sécu et ton bail — chaque mois de retard = un mois d'APL perdu",
          pitfalls: ["L'APL n'est PAS rétroactive — fais la demande dès le 1er mois", "Le 1er mois de loyer n'est jamais couvert (mois de carence)", "Si tu es en résidence CROUS, la demande est simplifiée"],
        },
      },
      {
        id: "transport", label: "Carte de transport", done: false,
        link: "https://www.tag.fr/",
        tip: "Abonnement étudiant TAG à Grenoble, ou Navigo à Paris — tarifs réduits.",
        guide: {
          steps: [
            "Renseigne-toi sur le réseau de transport de ta ville",
            "Cherche l'abonnement étudiant (souvent 50% de réduction)",
            "Prépare une photo d'identité et ta carte étudiante",
            "Souscris en ligne ou en agence du réseau de transport",
          ],
          documents: ["Carte étudiante ou attestation d'inscription", "Photo d'identité", "RIB pour le prélèvement mensuel"],
          deadline: "Dès la rentrée pour profiter des tarifs réduits",
          pitfalls: ["L'abonnement annuel est souvent bien moins cher que le mensuel", "Certaines villes offrent des aides transport supplémentaires (vérifie avec ta mairie)"],
        },
      },
      {
        id: "medecin", label: "Choisir un médecin traitant", done: false,
        link: "https://annuairesante.ameli.fr/",
        tip: "Trouve un médecin secteur 1 (sans dépassement) sur Ameli.",
        guide: {
          steps: [
            "Va sur annuairesante.ameli.fr",
            "Cherche un médecin généraliste secteur 1 (conventionné, pas de dépassement)",
            "Appelle pour vérifier qu'il accepte de nouveaux patients",
            "Lors de la première consultation, remplis le formulaire de déclaration de médecin traitant",
          ],
          documents: ["Carte Vitale ou attestation provisoire", "Pièce d'identité"],
          deadline: "Dans les 2 premiers mois — nécessaire pour le remboursement optimal",
          pitfalls: ["Sans médecin traitant, tu es moins bien remboursé (30% au lieu de 70%)", "Un médecin secteur 1 = consultation à 26,50 € remboursée à 70%", "Si tu ne trouves pas, demande au service santé de ta fac"],
        },
      },
      {
        id: "job", label: "Trouver un job étudiant", done: false,
        link: "https://www.jobaviz.fr/",
        tip: "20 h/semaine max avec un visa étudiant — Jobaviz, Indeed, réseau de la fac.",
        guide: {
          steps: [
            "Inscris-toi sur Jobaviz (CROUS), Indeed, et LinkedIn",
            "Vérifie ton droit au travail : 964h/an max avec un visa étudiant",
            "Prépare un CV français (format européen) et une lettre de motivation",
            "Cherche aussi auprès du service emploi de ta fac et du BDE",
          ],
          documents: ["CV au format français", "Titre de séjour avec autorisation de travail", "RIB pour le salaire", "Numéro de Sécurité Sociale"],
          deadline: "Pas de deadline — mais les offres de rentrée apparaissent dès septembre",
          pitfalls: ["Ne JAMAIS dépasser 964h/an (risque d'annulation du titre de séjour)", "Certains employeurs ne connaissent pas le droit au travail des étudiants étrangers — montre leur le texte de loi", "Déclare tes revenus aux impôts et à la CAF (sinon perte d'APL)"],
        },
      },
      {
        id: "sport-culture", label: "Inscription sport / associations", done: false,
        tip: "Le SUAPS de ta fac propose du sport gratuit — rejoins aussi un BDE ou une asso.",
        guide: {
          steps: [
            "Renseigne-toi au SUAPS (Service Universitaire des Activités Physiques et Sportives) de ta fac",
            "Inscris-toi aux activités gratuites (50+ sports en général)",
            "Rejoins un BDE ou une asso culturelle pour rencontrer du monde",
            "Consulte le programme des événements étudiants de ta ville",
          ],
          documents: ["Carte étudiante", "Certificat médical (pour certains sports)"],
          pitfalls: ["Les inscriptions SUAPS se remplissent vite — inscris-toi dès l'ouverture", "Les assos étudiantes sont le meilleur moyen de se faire un réseau"],
        },
      },
    ],
  },
];

/**
 * Build phases with access logic:
 * - French: no pre-arrival at all, post-arrival active (no temoin gate for French)
 * - In France + temoin: post-arrival active, pre-arrival hidden (can toggle)
 * - In France + NOT temoin: post-arrival LOCKED (needs email verification)
 * - Not in France: pre-arrival active, post-arrival shown as LOCKED PREVIEW
 */
function buildAccessPhases(
  rawPhases: ChecklistPhase[],
  isInFrance: boolean | null,
  isFrench: boolean,
  isTemoin: boolean,
  showPreArrival: boolean
): ChecklistPhase[] {
  if (isInFrance === null && !isFrench) return rawPhases;

  return rawPhases
    .map((phase) => {
      // French nationals: skip all pre-arrival, post-arrival always active
      if (isFrench && phase.scope === "pre") return null;
      if (isFrench) return phase;

      // In France: hide pre-arrival unless toggled
      if (isInFrance && phase.scope === "pre" && !showPreArrival) return null;

      // In France but NOT temoin: post-arrival is LOCKED (needs verification)
      if (isInFrance && phase.scope === "post" && !isTemoin) {
        return {
          ...phase,
          locked: true,
          items: phase.items.map((item) => ({ ...item, locked: true })),
        };
      }

      // Not in France: show post-arrival as LOCKED preview
      if (isInFrance === false && phase.scope === "post") {
        return {
          ...phase,
          locked: true,
          items: phase.items.map((item) => ({ ...item, locked: true })),
        };
      }

      // Filter individual items with scope
      const items = phase.items.map((item) => {
        if (isFrench && item.scope === "pre") return null;
        if (isInFrance && item.scope === "pre" && !showPreArrival) return null;
        if (isInFrance === false && item.scope === "post") return { ...item, locked: true };
        return item;
      }).filter(Boolean) as ChecklistItem[];

      if (items.length === 0) return null;
      return { ...phase, items };
    })
    .filter(Boolean) as ChecklistPhase[];
}

function calcProgress(phases: ChecklistPhase[]): number {
  const activeTasks = phases.flatMap((p) => p.items).filter((t) => !t.locked);
  const doneTasks = activeTasks.filter((t) => t.done).length;
  return activeTasks.length > 0 ? Math.round((doneTasks / activeTasks.length) * 100) : 0;
}

const IntegrationContext = createContext<IntegrationState | null>(null);

export const useIntegration = () => {
  const ctx = useContext(IntegrationContext);
  if (!ctx) throw new Error("useIntegration must be used within IntegrationProvider");
  return ctx;
};

// Test account that bypasses all restrictions for UX testing — DISABLED, using global test mode now
// const BYPASS_EMAIL = "donaldh.kponou@gmail.com";

export const IntegrationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [rawPhases, setRawPhases] = useState(allPhases);
  const [isInFrance, setIsInFranceState] = useState<boolean | null>(null);
  const [isFrench, setIsFrench] = useState(false);
  const [isTemoin, setIsTemoin] = useState(false);
  const [showPreArrival, setShowPreArrival] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_in_france, nationality, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      setIsInFranceState(profile.is_in_france ?? null);
      setIsFrench(profile.nationality === "🇫🇷 Française");
      setIsTemoin(profile.status === "temoin");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRawPhases(allPhases);
      setIsInFranceState(null);
      setIsFrench(false);
      setIsTemoin(false);
      return;
    }

    const loadData = async () => {
      await loadProfileData();

      const { data: tasks } = await supabase
        .from("user_tasks")
        .select("phase_id, task_id, done")
        .eq("user_id", user.id);

      if (tasks && tasks.length > 0) {
        const taskMap = new Map(tasks.map((t) => [`${t.phase_id}:${t.task_id}`, t.done]));
        setRawPhases((prev) =>
          prev.map((phase) => ({
            ...phase,
            items: phase.items.map((item) => ({
              ...item,
              done: taskMap.get(`${phase.id}:${item.id}`) ?? item.done,
            })),
          }))
        );
      }
    };

    loadData();
  }, [user, loadProfileData]);

  const refreshProfile = useCallback(async () => {
    await loadProfileData();
  }, [loadProfileData]);

  const phases = buildAccessPhases(rawPhases, isInFrance, isFrench, isTemoin, showPreArrival);

  useEffect(() => {
    if (!user) return;
    const progress = calcProgress(phases);
    supabase
      .from("profiles")
      .update({ integration_progress: progress })
      .eq("user_id", user.id)
      .then();
  }, [phases, user]);

  const setIsInFrance = useCallback(
    (value: boolean) => {
      setIsInFranceState(value);
      if (!value) setShowPreArrival(false);
      if (user) {
        supabase
          .from("profiles")
          .update({
            is_in_france: value,
            student_status: value ? "en_france" : "futur_arrivant",
          })
          .eq("user_id", user.id)
          .then();
      }
    },
    [user]
  );

  const toggleTask = useCallback(
    (phaseId: string, itemId: string) => {
      setRawPhases((prev) =>
        prev.map((phase) =>
          phase.id === phaseId
            ? {
                ...phase,
                items: phase.items.map((item) => {
                  if (item.id !== itemId || item.locked) return item;
                  const newDone = !item.done;
                  if (user) {
                    supabase
                      .from("user_tasks")
                      .upsert(
                        { user_id: user.id, phase_id: phaseId, task_id: itemId, done: newDone },
                        { onConflict: "user_id,phase_id,task_id" }
                      )
                      .then();
                  }
                  return { ...item, done: newDone };
                }),
              }
            : phase
        )
      );
    },
    [user]
  );

  const progress = calcProgress(phases);

  return (
    <IntegrationContext.Provider value={{ phases, progress, isInFrance, isFrench, isTemoin, toggleTask, setIsInFrance, refreshProfile }}>
      {children}
    </IntegrationContext.Provider>
  );
};
