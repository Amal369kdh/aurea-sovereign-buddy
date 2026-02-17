import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  name: string;
  avatar: string;
  uni: string;
  city: string;
  interests: string[];
  verified: boolean;
}

const profiles: Profile[] = [
  { name: "Sofia L.", avatar: "SL", uni: "UGA", city: "Grenoble", interests: ["Yoga", "Cinéma", "Voyage"], verified: true },
  { name: "Mehdi B.", avatar: "MB", uni: "INSA Lyon", city: "Lyon", interests: ["Football", "Code", "Manga"], verified: true },
  { name: "Chloé V.", avatar: "CV", uni: "Sciences Po", city: "Grenoble", interests: ["Lecture", "Cuisine", "Photo"], verified: true },
  { name: "Omar S.", avatar: "OS", uni: "Grenoble INP", city: "Grenoble", interests: ["Escalade", "Musique", "Gaming"], verified: true },
  { name: "Lina A.", avatar: "LA", uni: "UJM", city: "St-Etienne", interests: ["Danse", "Art", "Sport"], verified: true },
  { name: "Thomas K.", avatar: "TK", uni: "UGA", city: "Grenoble", interests: ["Running", "Tech", "Café"], verified: false },
];

interface DatingGridProps {
  onConnectClick: () => void;
}

const DatingGrid = ({ onConnectClick }: DatingGridProps) => {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">À proximité</h2>
          <p className="text-xs text-muted-foreground">Étudiants vérifiés autour de toi</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="group rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            {/* Avatar */}
            <div className="mb-4 flex flex-col items-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">
                  {p.avatar}
                </div>
                {p.verified && (
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full gold-gradient">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-base font-bold text-foreground">{p.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {p.city} · {p.uni}
              </div>
              {p.verified && (
                <Badge className="mt-2 h-5 border-0 bg-primary/15 text-[10px] text-primary">
                  Témoin Vérifié
                </Badge>
              )}
            </div>

            {/* Interests */}
            <div className="mb-4 flex flex-wrap justify-center gap-1.5">
              {p.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-xl bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Connect button — Gold only */}
            <button
              onClick={onConnectClick}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gold-gradient py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Crown className="h-4 w-4" />
              Se connecter
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DatingGrid;
