import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      { id: "campus-france", label: "Procédure Campus France", done: false },
      { id: "avi", label: "Attestation d'assurance voyage (AVI)", done: false },
    ],
  },
  {
    id: "installation",
    title: "Installation",
    icon: "🏠",
    items: [
      { id: "logement", label: "Trouver un logement", done: false },
      { id: "electricite", label: "Ouverture électricité / gaz", done: false, hasAya: true },
      { id: "banque", label: "Ouverture de compte bancaire", done: false },
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
  { id: "passeport", label: "Passeport", owned: false },
  { id: "admission", label: "Lettre d'admission", owned: false },
  { id: "bail", label: "Bail / Contrat de logement", owned: false },
  { id: "rib", label: "RIB Bancaire", owned: false },
  { id: "assurance", label: "Assurance habitation", owned: false },
  { id: "acte-naissance", label: "Acte de naissance traduit", owned: false },
  { id: "photo-id", label: "Photos d'identité", owned: false },
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
  const { user } = useAuth();
  const [phases, setPhases] = useState(defaultPhases);
  const [documents, setDocuments] = useState(defaultDocuments);

  // Load from DB on mount / user change
  useEffect(() => {
    if (!user) {
      setPhases(defaultPhases);
      setDocuments(defaultDocuments);
      return;
    }

    const loadData = async () => {
      // Load tasks
      const { data: tasks } = await supabase
        .from("user_tasks")
        .select("phase_id, task_id, done")
        .eq("user_id", user.id);

      if (tasks && tasks.length > 0) {
        const taskMap = new Map(tasks.map((t: any) => [`${t.phase_id}:${t.task_id}`, t.done]));
        setPhases((prev) =>
          prev.map((phase) => ({
            ...phase,
            items: phase.items.map((item) => ({
              ...item,
              done: taskMap.get(`${phase.id}:${item.id}`) ?? item.done,
            })),
          }))
        );
      }

      // Load documents
      const { data: docs } = await supabase
        .from("user_documents")
        .select("document_id, owned")
        .eq("user_id", user.id);

      if (docs && docs.length > 0) {
        const docMap = new Map(docs.map((d: any) => [d.document_id, d.owned]));
        setDocuments((prev) =>
          prev.map((doc) => ({
            ...doc,
            owned: docMap.get(doc.id) ?? doc.owned,
          }))
        );
      }
    };

    loadData();
  }, [user]);

  // Update progress in profile
  useEffect(() => {
    if (!user) return;
    const progress = calcProgress(phases, documents);
    supabase
      .from("profiles")
      .update({ integration_progress: progress } as any)
      .eq("user_id", user.id)
      .then();
  }, [phases, documents, user]);

  const toggleTask = useCallback(
    (phaseId: string, itemId: string) => {
      setPhases((prev) =>
        prev.map((phase) =>
          phase.id === phaseId
            ? {
                ...phase,
                items: phase.items.map((item) => {
                  if (item.id !== itemId) return item;
                  const newDone = !item.done;
                  // Persist to DB
                  if (user) {
                    supabase
                      .from("user_tasks")
                      .upsert(
                        { user_id: user.id, phase_id: phaseId, task_id: itemId, done: newDone } as any,
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

  const toggleDocument = useCallback(
    (docId: string) => {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id !== docId) return doc;
          const newOwned = !doc.owned;
          if (user) {
            supabase
              .from("user_documents")
              .upsert(
                { user_id: user.id, document_id: docId, owned: newOwned } as any,
                { onConflict: "user_id,document_id" }
              )
              .then();
          }
          return { ...doc, owned: newOwned };
        })
      );
    },
    [user]
  );

  const progress = calcProgress(phases, documents);

  return (
    <IntegrationContext.Provider value={{ phases, documents, progress, toggleTask, toggleDocument }}>
      {children}
    </IntegrationContext.Provider>
  );
};
