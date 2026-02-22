import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  hasAya?: boolean;
  scope?: "pre" | "post";
  link?: string;
  tip?: string;
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
}

const allPhases: ChecklistPhase[] = [
  {
    id: "pre-arrival",
    title: "Pré-arrivée",
    icon: "✈️",
    scope: "pre",
    items: [
      { id: "visa", label: "Demande de visa étudiant", done: false, hasAya: true, link: "https://france-visas.gouv.fr/", tip: "Commence la demande au moins 3 mois avant ton départ." },
      { id: "campus-france", label: "Procédure Campus France", done: false, link: "https://www.campusfrance.org/", tip: "Crée ton dossier sur Études en France et suis les étapes." },
      { id: "avi", label: "Assurance voyage internationale", done: false, link: "https://www.acs-ami.com/", tip: "Obligatoire pour le visa — vérifie les montants de couverture." },
      { id: "logement-anticipe", label: "Réserver un logement depuis l'étranger", done: false, link: "https://trouverunlogement.lescrous.fr/", tip: "CROUS, Studapart ou résidence étudiante — réserve tôt." },
    ],
  },
  {
    id: "installation",
    title: "Installation",
    icon: "🏠",
    scope: "post",
    items: [
      { id: "logement", label: "Trouver un logement", done: false, hasAya: true, link: "https://trouverunlogement.lescrous.fr/", tip: "CROUS, Studapart, LeBonCoin — commence par les résidences universitaires." },
      { id: "electricite", label: "Ouverture électricité / gaz", done: false, hasAya: true, link: "https://www.edf.fr/", tip: "Appelle EDF ou Engie avec ton contrat de bail." },
      { id: "banque", label: "Ouverture de compte bancaire", done: false, link: "https://www.boursobank.com/", tip: "Banque en ligne (Bourso, Revolut) ou agence — apporte ton passeport et justificatif de domicile." },
      { id: "telephone", label: "Forfait téléphone français", done: false, link: "https://www.free.fr/forfait-mobile/", tip: "Free Mobile à 2 € ou 19,99 € — sans engagement, idéal pour commencer." },
      { id: "assurance-habitation", label: "Assurance habitation", done: false, link: "https://www.heyme.care/", tip: "Obligatoire pour le bail — HEYME, LMDE ou MAIF proposent des offres étudiantes." },
    ],
  },
  {
    id: "legal",
    title: "Démarches légales",
    icon: "⚖️",
    scope: "post",
    items: [
      { id: "vls-ts", label: "Validation du VLS-TS (titre de séjour)", done: false, hasAya: true, link: "https://administration-etrangers-en-france.interieur.gouv.fr/", tip: "À faire dans les 3 premiers mois après ton arrivée — paiement de 75 €." },
      { id: "secu", label: "Numéro de Sécurité Sociale", done: false, hasAya: true, link: "https://etudiant-etranger.ameli.fr/", tip: "Inscris-toi en ligne sur ameli.fr — prévoir 2 à 4 semaines." },
    ],
  },
  {
    id: "vie-locale",
    title: "Vie quotidienne",
    icon: "🌍",
    scope: "post",
    items: [
      { id: "caf", label: "Demande d'aide au logement (CAF)", done: false, hasAya: true, link: "https://www.caf.fr/allocataires/mes-services-en-ligne/faire-une-simulation", tip: "Simule ton APL en ligne puis fais la demande — ça peut réduire ton loyer de 100 à 300 €." },
      { id: "transport", label: "Carte de transport", done: false, link: "https://www.tag.fr/", tip: "Abonnement étudiant TAG à Grenoble, ou Navigo à Paris — tarifs réduits." },
      { id: "medecin", label: "Choisir un médecin traitant", done: false, link: "https://annuairesante.ameli.fr/", tip: "Trouve un médecin secteur 1 (sans dépassement) sur Ameli." },
      { id: "job", label: "Trouver un job étudiant", done: false, link: "https://www.jobaviz.fr/", tip: "20 h/semaine max avec un visa étudiant — Jobaviz, Indeed, réseau de la fac." },
      { id: "sport-culture", label: "Inscription sport / associations", done: false, tip: "Le SUAPS de ta fac propose du sport gratuit — rejoins aussi un BDE ou une asso." },
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

  useEffect(() => {
    if (!user) {
      setRawPhases(allPhases);
      setIsInFranceState(null);
      setIsFrench(false);
      setIsTemoin(false);
      return;
    }

    const loadData = async () => {
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
  }, [user]);

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
    <IntegrationContext.Provider value={{ phases, progress, isInFrance, isFrench, isTemoin, toggleTask, setIsInFrance }}>
      {children}
    </IntegrationContext.Provider>
  );
};
