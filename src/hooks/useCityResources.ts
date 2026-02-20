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
  useful_tips?: string[];
  citations?: string[];
  fetched_at?: string;
  parse_error?: boolean;
}

const SESSION_KEY = "city_resources_cache";

export function useCityResources(city: string | null) {
  const { session } = useAuth();
  const [data, setData] = useState<CityResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city || !session?.access_token) return;

    const cacheKey = `${SESSION_KEY}_${city.toLowerCase().trim()}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Use cache if less than 24h old
        if (parsed.fetched_at && Date.now() - new Date(parsed.fetched_at).getTime() < 24 * 60 * 60 * 1000) {
          setData(parsed);
          return;
        }
      } catch { /* ignore */ }
    }

    const fetchResources = async () => {
      setLoading(true);
      setError(null);
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
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.error("useCityResources error:", e);
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [city, session?.access_token]);

  return { data, loading, error };
}
