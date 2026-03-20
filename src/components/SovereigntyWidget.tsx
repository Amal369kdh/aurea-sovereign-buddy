import { motion } from "framer-motion";
import { useIntegration } from "@/contexts/IntegrationContext";

const SovereigntyWidget = () => {
  const { progress } = useIntegration();

  return (
    <div className="rounded-4xl bg-card p-5 card-glow">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Track ta progression 🎯</h2>
          <p className="text-xs text-muted-foreground">Ton avancement dans les démarches admin</p>
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

    </div>
  );
};

export default SovereigntyWidget;
