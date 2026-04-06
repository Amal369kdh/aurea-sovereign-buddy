import { motion } from "framer-motion";
import { useIntegration } from "@/contexts/IntegrationContext";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";

const SovereigntyWidget = () => {
  const { progress, phases } = useIntegration();
  const navigate = useNavigate();

  // Build phase summary for visual breakdown
  const phaseSummary = phases
    .filter((p) => !p.locked)
    .map((p) => {
      const total = p.items.filter((i) => !i.locked).length;
      const done = p.items.filter((i) => !i.locked && i.done).length;
      return { id: p.id, title: p.title, icon: p.icon, done, total, complete: total > 0 && done === total };
    })
    .filter((p) => p.total > 0);

  const allDone = progress === 100;

  return (
    <button
      onClick={() => navigate("/mon-dossier")}
      className="w-full rounded-4xl bg-card p-5 card-glow text-left transition-colors hover:bg-card/80 cursor-pointer"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {allDone ? "Tout est en ordre 🎉" : "Track ta progression 🎯"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {allDone ? "Toutes tes démarches admin sont complètes" : "Ton avancement dans les démarches admin"}
          </p>
        </div>
        <motion.span
          key={progress}
          className="text-2xl font-extrabold gold-text"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {progress}%
        </motion.span>
      </div>

      {/* Horizontal progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(43 96% 46%), hsl(43 96% 66%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Phase breakdown */}
      {phaseSummary.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {phaseSummary.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                p.complete
                  ? "bg-success/10 text-success"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {p.complete ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              <span>{p.icon} {p.done}/{p.total}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
        <span>Ouvrir ma checklist</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
};

export default SovereigntyWidget;
