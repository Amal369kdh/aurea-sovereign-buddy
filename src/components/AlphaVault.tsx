import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ExternalLink,
  Save,
  Loader2,
  User,
  Calendar,
  CreditCard,
  MapPin,
  GraduationCap,
  Hash,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface StudentInfo {
  full_name: string;
  birth_date: string;
  nationality: string;
  passport_number: string;
  visa_number: string;
  secu_number: string;
  caf_number: string;
  university: string;
  student_id: string;
  address: string;
  bank_name: string;
  arrival_date: string;
  notes: string;
}

const EMPTY: StudentInfo = {
  full_name: "",
  birth_date: "",
  nationality: "",
  passport_number: "",
  visa_number: "",
  secu_number: "",
  caf_number: "",
  university: "",
  student_id: "",
  address: "",
  bank_name: "",
  arrival_date: "",
  notes: "",
};

const FIELDS: { key: keyof StudentInfo; label: string; icon: React.ElementType; type?: string; placeholder: string }[] = [
  { key: "full_name", label: "Nom complet", icon: User, placeholder: "Prénom Nom" },
  { key: "birth_date", label: "Date de naissance", icon: Calendar, type: "date", placeholder: "" },
  { key: "nationality", label: "Nationalité", icon: MapPin, placeholder: "Ex : Marocaine" },
  { key: "passport_number", label: "N° de passeport", icon: FileText, placeholder: "Ex : AB1234567" },
  { key: "visa_number", label: "N° de visa / VLS-TS", icon: Shield, placeholder: "Ex : 21FRA00001" },
  { key: "secu_number", label: "N° de Sécurité Sociale", icon: Hash, placeholder: "15 chiffres" },
  { key: "caf_number", label: "N° allocataire CAF", icon: CreditCard, placeholder: "7 chiffres" },
  { key: "university", label: "Université / École", icon: GraduationCap, placeholder: "Ex : Université Grenoble Alpes" },
  { key: "student_id", label: "N° étudiant", icon: Hash, placeholder: "Ex : 22012345" },
  { key: "address", label: "Adresse actuelle", icon: MapPin, placeholder: "Rue, code postal, ville" },
  { key: "bank_name", label: "Banque", icon: CreditCard, placeholder: "Ex : BNP Paribas" },
  { key: "arrival_date", label: "Date d'arrivée en France", icon: Calendar, type: "date", placeholder: "" },
];

const AlphaVault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [info, setInfo] = useState<StudentInfo>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved info from profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, birth_date, nationality, university, arrival_date, city")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setInfo((prev) => ({
          ...prev,
          full_name: (data as any).full_name || "",
          birth_date: (data as any).birth_date || "",
          nationality: (data as any).nationality || "",
          university: (data as any).university || "",
          arrival_date: (data as any).arrival_date || "",
          address: (data as any).city ? `${(data as any).city}, France` : "",
        }));
      }
      // Load extended info from sessionStorage (until we have a dedicated table)
      try {
        const saved = localStorage.getItem(`student_info_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setInfo((prev) => ({ ...prev, ...parsed }));
        }
      } catch {}
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    // Save core fields to profile
    await supabase
      .from("profiles")
      .update({
        full_name: info.full_name || null,
        birth_date: info.birth_date || null,
        nationality: info.nationality || null,
        university: info.university || null,
        arrival_date: info.arrival_date || null,
      } as any)
      .eq("user_id", user.id);

    // Save extended fields locally (until dedicated table)
    try {
      localStorage.setItem(`student_info_${user.id}`, JSON.stringify(info));
    } catch {}

    toast({ title: "Profil sauvegardé ✓", description: "Tes informations ont été mises à jour." });
    setSaving(false);
  };

  const filledCount = Object.values(info).filter((v) => v.trim().length > 0).length;

  if (!loaded) {
    return (
      <div className="mt-10 flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Mon Profil Étudiant</h2>
          <p className="text-sm text-muted-foreground">
            Remplis tes informations clés — Amal s'en servira pour t'aider.
          </p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {filledCount}/{FIELDS.length + 1}
        </span>
      </div>

      {/* Digiposte link */}
      <a
        href="https://www.digiposte.fr/"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gold-gradient">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Digiposte — Coffre-fort numérique</p>
          <p className="text-xs text-muted-foreground">
            Stocke tes documents officiels en toute sécurité (gratuit).
          </p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
      </a>

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((field, i) => {
          const Icon = field.icon;
          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                <Icon className="h-3.5 w-3.5" />
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                value={info[field.key]}
                onChange={(e) => setInfo((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                maxLength={200}
                className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </motion.div>
          );
        })}

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: FIELDS.length * 0.03, duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-3 sm:col-span-2"
        >
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <FileText className="h-3.5 w-3.5" />
            Notes personnelles
          </label>
          <textarea
            value={info.notes}
            onChange={(e) => setInfo((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Informations complémentaires, rappels, numéros utiles…"
            maxLength={1000}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </motion.div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Sauvegarder mon profil
      </button>
    </div>
  );
};

export default AlphaVault;
