import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Phone, MapPin, X, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const emergencyNumbers = [
  { label: "SAMU (urgences médicales)", number: "15", color: "text-destructive" },
  { label: "Police / Gendarmerie", number: "17", color: "text-info" },
  { label: "Pompiers", number: "18", color: "text-destructive" },
  { label: "Urgences européennes", number: "112", color: "text-primary" },
  { label: "Violences femmes info", number: "3919", color: "text-success" },
  { label: "Prévention suicide", number: "3114", color: "text-info" },
];

const buildSafePlaces = (city: string) => [
  { name: "Commissariat de Police", address: city, type: "Police", mapsQuery: "commissariat police " + city },
  { name: "Hôpital — Urgences", address: city, type: "Hôpital", mapsQuery: "urgences hôpital " + city },
  { name: "CROUS — Service social", address: city, type: "Social", mapsQuery: "CROUS service social " + city },
  { name: "Service santé étudiants", address: city, type: "Campus", mapsQuery: "service santé étudiants " + city },
];

const SecuritySovereign = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Grenoble");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("city")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.city) setCity(data.city);
      });
  }, [user]);

  const safePlaces = buildSafePlaces(city);

  return (
    <>
      {/* Discreet floating button — positioned above Amal */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/15 text-destructive shadow-md backdrop-blur-sm transition-colors hover:bg-destructive/25 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Sécurité — Numéros d'urgence"
        title="Sécurité"
      >
        <ShieldAlert className="h-5 w-5" />
      </motion.button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-t-4xl border border-border bg-card p-6 sm:rounded-4xl sm:m-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Sécurité Souveraine</h2>
                  <p className="text-xs text-muted-foreground">Numéros d'urgence & refuges</p>
                </div>
              </div>

              {/* Warning banner */}
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-muted-foreground">
                  En cas de <span className="font-bold text-destructive">danger immédiat</span>, appelle le 17 (Police) ou le 112. 
                  Ces numéros sont <span className="font-semibold text-foreground">gratuits</span> et fonctionnent même sans forfait.
                </p>
              </div>

              {/* Emergency numbers */}
              <h3 className="mb-3 text-sm font-bold text-foreground">📞 Numéros d'urgence</h3>
              <div className="mb-6 grid grid-cols-2 gap-2">
                {emergencyNumbers.map((e) => (
                  <a
                    key={e.number}
                    href={`tel:${e.number}`}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3 transition-all hover:bg-secondary cursor-pointer"
                  >
                    <Phone className={`h-4 w-4 shrink-0 ${e.color}`} />
                    <div>
                      <p className={`text-lg font-extrabold ${e.color}`}>{e.number}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{e.label}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Safe Places */}
              <h3 className="mb-3 text-sm font-bold text-foreground">🛡️ Points de refuge (Safe Places)</h3>
              <div className="space-y-2">
                {safePlaces.map((place) => (
                  <a
                    key={place.name}
                    href={`https://maps.google.com/?q=${encodeURIComponent(place.mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3 transition-all hover:bg-secondary cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{place.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                      {place.type}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>

              {/* Témoin reminder */}
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  🔒 Le badge <span className="font-bold text-primary">Témoin</span> (email .univ vérifié) est obligatoire pour les messages privés. 
                  Personne d'extérieur au monde étudiant ne peut te contacter.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SecuritySovereign;
