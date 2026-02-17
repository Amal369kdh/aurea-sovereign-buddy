import { motion } from "framer-motion";

interface SovereigntyWidgetProps {
  progress?: number;
}

const SovereigntyWidget = ({ progress = 42 }: SovereigntyWidgetProps) => {
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
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Progress */}
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
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
              className="text-4xl font-extrabold gold-text"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {progress}%
            </motion.span>
            <span className="text-xs text-muted-foreground">complété</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Logement", done: true },
          { label: "Banque", done: true },
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
