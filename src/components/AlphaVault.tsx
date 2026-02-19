import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, ExternalLink, Save, Loader2, Calendar,
  CreditCard, Shield, Hash, Clock, HelpCircle, CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */

interface AdminInfo {
  titre_sejour_expiry: string;
  apl_status: "faite" | "a_faire" | "besoin_aide";
  next_deadline_label: string;
  next_deadline_date: string;
  secu_number: string;
  caf_number: string;
  notes: string;
}

const EMPTY: AdminInfo = {
  titre_sejour_expiry: "",
  apl_status: "a_faire",
  next_deadline_label: "",
  next_deadline_date: "",
  secu_number: "",
  caf_number: "",
  notes: "",
};

const APL_OPTIONS: { value: AdminInfo["apl_status"]; label: string; icon: React.ElementType }[] = [
  { value: "faite", label: "Faite ✓", icon: CheckCircle },
  { value: "a_faire", label: "À faire", icon: Clock },
  { value: "besoin_aide", label: "Besoin d'aide", icon: HelpCircle },
];

/* ─── Component ─── */

const AlphaVault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [info, setInfo] = useState<AdminInfo>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isFrench, setIsFrench] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("titre_sejour_expiry, apl_status, next_deadline_label, next_deadline_date, nationality, student_status")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const d = data as any;
        setIsFrench(d.student_status === "francais" || d.nationality === "🇫🇷 Française");
        setInfo((prev) => ({
          ...prev,
          titre_sejour_expiry: d.titre_sejour_expiry || "",
          apl_status: d.apl_status || "a_faire",
          next_deadline_label: d.next_deadline_label || "",
          next_deadline_date: d.next_deadline_date || "",
        }));
      }
      // Load extended info from localStorage
      try {
        const saved = localStorage.getItem(`admin_info_${user.id}`);
        if (saved) setInfo((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({
        titre_sejour_expiry: info.titre_sejour_expiry || null,
        apl_status: info.apl_status,
        next_deadline_label: info.next_deadline_label || null,
        next_deadline_date: info.next_deadline_date || null,
      } as any)
      .eq("user_id", user.id);

    try {
      localStorage.setItem(`admin_info_${user.id}`, JSON.stringify({
        secu_number: info.secu_number,
        caf_number: info.caf_number,
        notes: info.notes,
      }));
    } catch {}

    toast({ title: "Sauvegardé ✓", description: "Tes informations administratives ont été mises à jour." });
    setSaving(false);
  };

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
          <h2 className="text-xl font-extrabold text-foreground">Administratif & Dates clés</h2>
          <p className="text-sm text-muted-foreground">
            Remplis tes échéances — l'IA t'enverra des alertes personnalisées.
          </p>
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Titre de séjour - hidden for French */}
        {!isFrench && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
              <Shield className="h-3.5 w-3.5" />
              Expiration du titre de séjour
            </label>
            <input
              type="month"
              value={info.titre_sejour_expiry}
              onChange={(e) => setInfo((prev) => ({ ...prev, titre_sejour_expiry: e.target.value }))}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">L'IA te préviendra 2 mois avant l'échéance.</p>
          </motion.div>
        )}

        {/* APL Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="rounded-2xl border border-border bg-card p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Demande d'APL (aide au logement)
          </label>
          <div className="flex gap-2">
            {APL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInfo((prev) => ({ ...prev, apl_status: opt.value }))}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-all cursor-pointer ${
                  info.apl_status === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Numéro Sécu */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="rounded-2xl border border-border bg-card p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <Hash className="h-3.5 w-3.5" />
            N° de Sécurité Sociale
          </label>
          <input
            type="text"
            value={info.secu_number}
            onChange={(e) => setInfo((prev) => ({ ...prev, secu_number: e.target.value }))}
            placeholder="15 chiffres"
            maxLength={15}
            className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </motion.div>

        {/* Numéro CAF */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="rounded-2xl border border-border bg-card p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            N° allocataire CAF
          </label>
          <input
            type="text"
            value={info.caf_number}
            onChange={(e) => setInfo((prev) => ({ ...prev, caf_number: e.target.value }))}
            placeholder="7 chiffres"
            maxLength={7}
            className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </motion.div>

        {/* Prochaine échéance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl border border-border bg-card p-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Prochaine échéance importante
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={info.next_deadline_label}
              onChange={(e) => setInfo((prev) => ({ ...prev, next_deadline_label: e.target.value }))}
              placeholder="Ex : Renouvellement bourse, inscription…"
              maxLength={100}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="date"
              value={info.next_deadline_date}
              onChange={(e) => setInfo((prev) => ({ ...prev, next_deadline_date: e.target.value }))}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
            <FileText className="h-3.5 w-3.5" />
            Notes personnelles
          </label>
          <textarea
            value={info.notes}
            onChange={(e) => setInfo((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Rappels, numéros utiles, informations complémentaires…"
            maxLength={1000}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </motion.div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Sauvegarder
      </button>
    </div>
  );
};

export default AlphaVault;
