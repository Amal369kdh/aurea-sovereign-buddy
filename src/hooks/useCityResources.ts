import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CityResources {
  city: string;
  crous?: {
    name: string;
    address: string;
    phone: string;
    url: string;
    resto_u?: { name: string; address: string; url?: string }[];
  };
  transport?: {
    network_name: string;
    student_subscription: string;
    url: string;
  };
  health?: {
    university_health_center?: { name: string; address: string; phone: string };
    emergency?: string;
    sos_medecins?: { phone: string; url: string };
    nightline?: string;
  };
  prefecture?: {
    name: string;
    address: string;
    rdv_url: string;
    phone: string;
  };
  caf?: {
    address: string;
    phone: string;
    url: string;
  };
  banques?: {
    liste?: { name: string; address: string; type: string }[];
    conseil?: string;
  };
  logement?: {
    residences_crous?: { name: string; address: string; url?: string }[];
    autres?: string[];
  };
  useful_tips?: string[];
  citations?: string[];
  fetched_at?: string;
  parse_error?: boolean;
  last_updated_at?: string;
  coming_soon?: boolean;
}

export function useCityResources(city: string | null) {
  const { session } = useAuth();
  const [data, setData] = useState<CityResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city || !session?.access_token) return;

    const cacheKey = city.toLowerCase().trim();

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Try reading directly from Supabase DB first (no Perplexity call)
      const { data: cached } = await supabase
        .from("city_resources_cache" as any)
        .select("data, last_updated_at")
        .eq("city", cacheKey)
        .maybeSingle();

      if (cached?.data) {
        setData({ ...(cached.data as CityResources), last_updated_at: cached.last_updated_at });
        setLoading(false);
        return;
      }

      // 2. Not in DB yet — call the edge function (which will fetch & persist)
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/city-resources`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ city }),
          }
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `Erreur ${resp.status}`);
        }

        const result = await resp.json();
        setData(result);
      } catch (e) {
        console.error("useCityResources error:", e);
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [city, session?.access_token]);

  return { data, loading, error };
}
