import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Shield, CreditCard, Home, GraduationCap, Clock, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Deadline {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  date: Date;
  urgency: "past" | "urgent" | "soon" | "ok";
  category: string;
}

const URGENCY_STYLES: Record<string, string> = {
  past: "border-destructive/30 bg-destructive/5",
  urgent: "border-warning/30 bg-warning/5",
  soon: "border-primary/30 bg-primary/5",
  ok: "border-border bg-secondary/30",
};

const URGENCY_BADGE: Record<string, { label: string; className: string }> = {
  past: { label: "En retard", className: "bg-destructive/15 text-destructive" },
  urgent: { label: "Urgent", className: "bg-warning/15 text-warning" },
  soon: { label: "Bientôt", className: "bg-primary/15 text-primary" },
  ok: { label: "Planifié", className: "bg-muted text-muted-foreground" },
};

function getUrgency(date: Date): Deadline["urgency"] {
  const now = new Date();
  const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "past";
  if (diffDays <= 14) return "urgent";
  if (diffDays <= 60) return "soon";
  return "ok";
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const AdminCalendar = () => {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from("profiles")
      .select("arrival_date, titre_sejour_expiry, apl_status, visa_type, is_in_france, next_deadline_label, next_deadline_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }

        const items: Deadline[] = [];

        // VLS-TS validation (within 3 months of arrival)
        if (data.arrival_date && data.visa_type && ["vls-ts", "vls_ts", "long_sejour"].includes(data.visa_type.toLowerCase().replace(/-/g, "_"))) {
          const arrival = new Date(data.arrival_date);
          const vlsDeadline = addMonths(arrival, 3);
          items.push({
            id: "vls-ts",
            icon: Shield,
            title: "Validation VLS-TS (ANEF)",
            description: `À valider avant le ${vlsDeadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
            date: vlsDeadline,
            urgency: getUrgency(vlsDeadline),
            category: "Visa",
          });
        }

        // Titre de séjour renewal
        if (data.titre_sejour_expiry) {
          const expiry = new Date(data.titre_sejour_expiry);
          const renewDeadline = addMonths(expiry, -4); // Start 4 months before
          items.push({
            id: "titre-sejour",
            icon: Shield,
            title: "Renouvellement titre de séjour",
            description: `Expiration : ${expiry.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}. Lancer la demande 4 mois avant.`,
            date: renewDeadline,
            urgency: getUrgency(renewDeadline),
            category: "Visa",
          });
        }

        // APL/CAF
        if (data.apl_status === "a_faire" || data.apl_status === "besoin_aide") {
          const aplDate = data.arrival_date ? addMonths(new Date(data.arrival_date), 1) : new Date();
          items.push({
            id: "apl",
            icon: CreditCard,
            title: "Demande APL / CAF",
            description: data.apl_status === "besoin_aide" ? "Tu as indiqué avoir besoin d'aide — demande à Amal !" : "À faire dès l'emménagement pour recevoir ton aide au logement.",
            date: aplDate,
            urgency: data.apl_status === "besoin_aide" ? "urgent" : getUrgency(aplDate),
            category: "Logement",
          });
        }

        // Sécurité sociale (Ameli) — within 3 months of arrival
        if (data.arrival_date && data.is_in_france) {
          const arrival = new Date(data.arrival_date);
          const ameliDeadline = addMonths(arrival, 3);
          items.push({
            id: "ameli",
            icon: Home,
            title: "Inscription Sécurité sociale (Ameli)",
            description: `À faire le plus tôt possible après l'arrivée.`,
            date: ameliDeadline,
            urgency: getUrgency(ameliDeadline),
            category: "Santé",
          });
        }

        // Inscription universitaire (1 month after arrival)
        if (data.arrival_date) {
          const arrival = new Date(data.arrival_date);
          const inscriptionDate = addMonths(arrival, 1);
          items.push({
            id: "inscription-uni",
            icon: GraduationCap,
            title: "Inscription administrative université",
            description: "Finaliser l'inscription avec tous les documents requis.",
            date: inscriptionDate,
            urgency: getUrgency(inscriptionDate),
            category: "Études",
          });
        }

        // Custom deadline from profile
        if (data.next_deadline_label && data.next_deadline_date) {
          const d = new Date(data.next_deadline_date);
          items.push({
            id: "custom",
            icon: Calendar,
            title: data.next_deadline_label,
            description: `Date limite : ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
            date: d,
            urgency: getUrgency(d),
            category: "Perso",
          });
        }

        // Sort by urgency priority then date
        const urgencyOrder = { past: 0, urgent: 1, soon: 2, ok: 3 };
        items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.date.getTime() - b.date.getTime());

        setDeadlines(items);
        setLoading(false);
      });
  }, [user]);

  const urgentCount = deadlines.filter((d) => d.urgency === "past" || d.urgency === "urgent").length;
  const visibleDeadlines = expanded ? deadlines : deadlines.slice(0, 3);

  if (loading) return null;
  if (deadlines.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground">Calendrier admin perso</h3>
          <p className="text-xs text-muted-foreground">
            {urgentCount > 0
              ? `${urgentCount} échéance${urgentCount > 1 ? "s" : ""} à traiter rapidement`
              : `${deadlines.length} échéance${deadlines.length > 1 ? "s" : ""} à venir`}
          </p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning">
            <AlertTriangle className="h-3 w-3" />
            {urgentCount}
          </div>
        )}
      </div>

      {/* Deadlines list */}
      <div className="px-5 pb-4 space-y-2">
        <AnimatePresence initial={false}>
          {visibleDeadlines.map((dl, i) => {
            const Icon = dl.icon;
            const badge = URGENCY_BADGE[dl.urgency];
            return (
              <motion.div
                key={dl.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 rounded-2xl border p-3 ${URGENCY_STYLES[dl.urgency]}`}
              >
                <div className="mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-foreground truncate">{dl.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{dl.description}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {deadlines.length > 3 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {expanded ? "Voir moins" : `Voir les ${deadlines.length - 3} autres`}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AdminCalendar;
