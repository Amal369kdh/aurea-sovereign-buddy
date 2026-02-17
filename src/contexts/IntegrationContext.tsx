import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  hasAya?: boolean;
}

interface ChecklistPhase {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
}

interface Document {
  id: string;
  label: string;
  owned: boolean;
}

interface IntegrationState {
  phases: ChecklistPhase[];
  documents: Document[];
  progress: number;
  toggleTask: (phaseId: string, itemId: string) => void;
  toggleDocument: (docId: string) => void;
}

const defaultPhases: ChecklistPhase[] = [
  {
    id: "pre-arrival",
    title: "Pré-arrivée",
    icon: "✈️",
    items: [
      { id: "visa", label: "Demande de Visa", done: false },
      { id: "campus-france", label: "Procédure Campus France", done: true },
      { id: "avi", label: "Attestation d'assurance voyage (AVI)", done: false },
    ],
  },
  {
    id: "installation",
    title: "Installation",
    icon: "🏠",
    items: [
      { id: "logement", label: "Trouver un logement", done: true },
      { id: "electricite", label: "Ouverture électricité / gaz", done: false, hasAya: true },
      { id: "banque", label: "Ouverture de compte bancaire", done: true },
    ],
  },
  {
    id: "legal",
    title: "Légal",
    icon: "⚖️",
    items: [
      { id: "vls-ts", label: "Validation VLS-TS (Titre de séjour)", done: false, hasAya: true },
      { id: "secu", label: "Numéro de Sécurité Sociale", done: false, hasAya: true },
    ],
  },
  {
    id: "vie-locale",
    title: "Vie Locale",
    icon: "🌍",
    items: [
      { id: "caf", label: "Demande d'aide au logement (CAF)", done: false, hasAya: true },
      { id: "transport", label: "Carte de transport", done: false },
      { id: "job", label: "Job étudiant", done: false },
    ],
  },
];

const defaultDocuments: Document[] = [
  { id: "passeport", label: "Passeport", owned: true },
  { id: "admission", label: "Lettre d'admission", owned: true },
  { id: "bail", label: "Bail / Contrat de logement", owned: false },
  { id: "rib", label: "RIB Bancaire", owned: true },
  { id: "assurance", label: "Assurance habitation", owned: false },
  { id: "acte-naissance", label: "Acte de naissance traduit", owned: false },
  { id: "photo-id", label: "Photos d'identité", owned: true },
  { id: "certificat-scolarite", label: "Certificat de scolarité", owned: false },
];

function calcProgress(phases: ChecklistPhase[], documents: Document[]): number {
  const allTasks = phases.flatMap((p) => p.items);
  const doneTasks = allTasks.filter((t) => t.done).length;
  const ownedDocs = documents.filter((d) => d.owned).length;
  const total = allTasks.length + documents.length;
  const done = doneTasks + ownedDocs;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

const IntegrationContext = createContext<IntegrationState | null>(null);

export const useIntegration = () => {
  const ctx = useContext(IntegrationContext);
  if (!ctx) throw new Error("useIntegration must be used within IntegrationProvider");
  return ctx;
};

export const IntegrationProvider = ({ children }: { children: ReactNode }) => {
  const [phases, setPhases] = useState(defaultPhases);
  const [documents, setDocuments] = useState(defaultDocuments);

  const toggleTask = useCallback((phaseId: string, itemId: string) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              items: phase.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            }
          : phase
      )
    );
  }, []);

  const toggleDocument = useCallback((docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, owned: !doc.owned } : doc))
    );
  }, []);

  const progress = calcProgress(phases, documents);

  return (
    <IntegrationContext.Provider value={{ phases, documents, progress, toggleTask, toggleDocument }}>
      {children}
    </IntegrationContext.Provider>
  );
};
