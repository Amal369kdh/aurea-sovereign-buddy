import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentData {
  display_name: string | null;
  avatar_initials: string | null;
  city: string | null;
  university: string | null;
  is_verified: boolean;
}

const SocialPulse = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, avatar_initials, city, university, is_verified")
      .eq("status", "temoin")
      .eq("is_verified", true)
      .order("updated_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setStudents(data ?? []);
        setLoadingStudents(false);
      });
  }, []);

  return (
    <div className="rounded-4xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Social Pulse</h2>
          <p className="text-xs text-muted-foreground">Étudiants Témoins prêts à aider dans ta ville</p>
        </div>
        <button
          onClick={() => navigate("/hub-social")}
          className="flex items-center gap-1 text-xs font-medium text-primary cursor-pointer hover:underline"
        >
          Voir tout <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {loadingStudents ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2 rounded-3xl border border-border bg-secondary/40 px-5 py-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
          ))
        ) : students.length === 0 ? (
          <p className="w-full text-center text-sm text-muted-foreground py-4">Rejoins les premiers Témoins !</p>
        ) : (
          students.map((s, i) => (
            <motion.div
              key={s.display_name ?? i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex shrink-0 flex-col items-center gap-2 rounded-3xl border border-border bg-secondary/40 px-5 py-4 transition-all hover:border-primary/30 hover:bg-secondary cursor-pointer"
            >
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                  {s.avatar_initials ?? "??"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                  <ShieldCheck className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xs font-semibold text-foreground whitespace-nowrap">{s.display_name ?? "Anonyme"}</p>
              <p className="text-[10px] text-muted-foreground">{s.university ?? s.city ?? ""}</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Témoin
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* Community stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Témoins actifs", value: "120+" },
          { label: "Posts d'entraide", value: "340+" },
          { label: "Solutions données", value: "89" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-secondary/50 px-3 py-2.5 text-center">
            <p className="text-base font-extrabold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialPulse;
