import { motion } from "framer-motion";
import { FileText, Shield, Building2, ChevronRight } from "lucide-react";

const tasks = [
  {
    icon: FileText,
    title: "Finaliser ton dossier CAF",
    subtitle: "Date limite : 28 février",
    urgent: true,
  },
  {
    icon: Shield,
    title: "Assurance habitation",
    subtitle: "Document requis pour le bail",
    urgent: true,
  },
  {
    icon: Building2,
    title: "Ouverture de compte bancaire",
    subtitle: "RDV pris le 22 février",
    urgent: false,
  },
];

const DailyRoadmap = () => {
  return (
    <div className="rounded-4xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Daily Roadmap</h2>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          3 tâches
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, i) => (
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
        ))}
      </div>
    </div>
  );
};

export default DailyRoadmap;
