import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Retourne la liste des villes actives depuis les feature_flags (clés `city_active_<ville>`).
 * Grenoble est toujours incluse comme fallback.
 */
export const useActiveCities = () => {
  const [activeCities, setActiveCities] = useState<string[]>(["grenoble"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("feature_flags")
      .select("key, enabled")
      .like("key", "city_active_%")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const enabled = data
            .filter((f) => f.enabled)
            .map((f) => f.key.replace("city_active_", "").toLowerCase());
          // Toujours garder grenoble comme fallback
          const cities = Array.from(new Set([...enabled, "grenoble"]));
          setActiveCities(cities);
        }
        setLoading(false);
      });
  }, []);

  return { activeCities, loading };
};
