import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type FeatureFlags = Record<string, boolean>;

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("feature_flags")
      .select("key, enabled")
      .then(({ data }) => {
        if (data) {
          const map: FeatureFlags = {};
          data.forEach((f) => { map[f.key] = f.enabled; });
          setFlags(map);
        }
        setLoading(false);
      });
  }, []);

  return { flags, loading };
};
