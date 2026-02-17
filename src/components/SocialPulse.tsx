import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const students = [
  { name: "Amina K.", uni: "UGA", avatar: "AK" },
  { name: "Lucas M.", uni: "INSA Lyon", avatar: "LM" },
  { name: "Fatou D.", uni: "UJM", avatar: "FD" },
  { name: "Yuki T.", uni: "Grenoble INP", avatar: "YT" },
  { name: "Carlos R.", uni: "Sciences Po", avatar: "CR" },
];

const SocialPulse = () => {
  return (
    <div className="rounded-4xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Social Pulse</h2>
          <p className="text-xs text-muted-foreground">Étudiants Témoins à proximité</p>
        </div>
        <span className="text-xs font-medium text-primary cursor-pointer hover:underline">
          Voir tout →
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {students.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex shrink-0 flex-col items-center gap-2 rounded-3xl border border-border bg-secondary/40 px-5 py-4 transition-all hover:border-primary/30 hover:bg-secondary cursor-pointer"
          >
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                {s.avatar}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                <ShieldCheck className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <p className="text-xs font-semibold text-foreground whitespace-nowrap">{s.name}</p>
            <p className="text-[10px] text-muted-foreground">{s.uni}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SocialPulse;
