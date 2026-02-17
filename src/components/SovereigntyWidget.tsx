import { motion } from "framer-motion";
import { useIntegration } from "@/contexts/IntegrationContext";

const SovereigntyWidget = () => {
  const { progress } = useIntegration();
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-4xl bg-card p-6 card-glow">
      <h2 className="mb-1 text-lg font-bold text-foreground">Souveraineté</h2>
      <p className="mb-6 text-sm text-muted-foreground">Ton avancement d'installation</p>

      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              transform="rotate(-90 100 100)"
            />
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(43 96% 56%)" />
                <stop offset="100%" stopColor="hsl(43 96% 70%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={progress}
              className="text-4xl font-extrabold gold-text"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {progress}%
            </motion.span>
            <span className="text-xs text-muted-foreground">complété</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Logement", done: progress >= 30 },
          { label: "Banque", done: progress >= 20 },
          { label: "Sécu", done: false },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
              item.done
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {item.done ? "✓ " : "○ "}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SovereigntyWidget;
