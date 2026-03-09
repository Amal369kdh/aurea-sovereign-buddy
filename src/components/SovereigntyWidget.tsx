import { motion } from "framer-motion";
import { useIntegration } from "@/contexts/IntegrationContext";

const SovereigntyWidget = () => {
  const { progress } = useIntegration();

  return (
    <div className="rounded-4xl bg-card p-5 card-glow">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Score d'intégration</h2>
          <p className="text-xs text-muted-foreground">Ton avancement dans les démarches</p>
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

      {/* Indicators on one line */}
      <div className="mt-3 flex gap-2">
        {indicators.map((item) => (
          <div
            key={item.label}
            className={`flex-1 rounded-xl px-2 py-1.5 text-center text-xs font-semibold ${
              item.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {item.done ? "✓ " : "○ "}{item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SovereigntyWidget;
