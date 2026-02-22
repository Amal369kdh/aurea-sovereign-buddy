import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CreditCard, Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  urgent: boolean;
}

const DailyRoadmap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("next_deadline_label, next_deadline_date, apl_status, titre_sejour_expiry")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const built: Task[] = [];
        if (data?.next_deadline_label && data?.next_deadline_date) {
          const d = new Date(data.next_deadline_date);
          const formatted = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
          built.push({ icon: Calendar, title: data.next_deadline_label, subtitle: "Date limite : " + formatted, urgent: true });
        }
        if (data?.apl_status === "a_faire" || data?.apl_status === "besoin_aide") {
          built.push({
            icon: CreditCard,
            title: "Demande d'APL",
            subtitle: data.apl_status === "besoin_aide" ? "Besoin d'aide" : "À faire",
            urgent: data.apl_status === "besoin_aide",
          });
        }
        if (data?.titre_sejour_expiry) {
          const exp = new Date(data.titre_sejour_expiry);
          const now = new Date();
          const diffMs = exp.getTime() - now.getTime();
          const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
          const monthStr = exp.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
          built.push({ icon: Shield, title: "Titre de séjour", subtitle: "Expire " + monthStr, urgent: diffMonths <= 2 });
        }
        setTasks(built);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="rounded-4xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Daily Roadmap</h2>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {loading ? "…" : tasks.length + " tâche" + (tasks.length !== 1 ? "s" : "")}
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-3xl border border-border bg-secondary/50 p-4">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className="rounded-3xl border border-border bg-secondary/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ajoute tes échéances dans{" "}
              <button onClick={() => navigate("/mon-dossier")} className="font-semibold text-primary hover:underline cursor-pointer">
                Mon Dossier
              </button>
            </p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="group flex cursor-pointer items-center gap-4 rounded-3xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  task.urgent
                    ? "gold-gradient text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <task.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DailyRoadmap;
