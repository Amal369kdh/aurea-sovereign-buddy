import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/contexts/IntegrationContext";

interface MentorOffer {
  id: string;
  mentor_id: string;
  topic: string;
  description: string | null;
  is_active: boolean;
  contact_count: number;
  created_at: string;
  mentor_name?: string;
  mentor_initials?: string;
}

export function useMentoring() {
  const { user } = useAuth();
  const { isTemoin } = useIntegration();
  const [offers, setOffers] = useState<MentorOffer[]>([]);
  const [myOffers, setMyOffers] = useState<MentorOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    setLoading(true);
    
    // Fetch active mentor offers
    const { data } = await (supabase as any)
      .from("mentor_offers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch mentor profiles
      const mentorIds = [...new Set(data.map((o: any) => o.mentor_id))];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, display_name, avatar_initials")
        .in("user_id", mentorIds as string[]);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const enriched = data.map((o: any) => ({
        ...o,
        mentor_name: profileMap.get(o.mentor_id)?.display_name || "Mentor",
        mentor_initials: profileMap.get(o.mentor_id)?.avatar_initials || "M",
      }));

      setOffers(enriched.filter((o: MentorOffer) => o.mentor_id !== user?.id));
      setMyOffers(enriched.filter((o: MentorOffer) => o.mentor_id === user?.id));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchOffers();
  }, [user]);

  const createOffer = async (topic: string, description: string) => {
    if (!user || !isTemoin) return null;
    const { data, error } = await (supabase as any)
      .from("mentor_offers")
      .insert({ mentor_id: user.id, topic, description })
      .select()
      .single();
    if (!error) await fetchOffers();
    return { data, error };
  };

  const toggleOffer = async (offerId: string, isActive: boolean) => {
    await (supabase as any)
      .from("mentor_offers")
      .update({ is_active: isActive })
      .eq("id", offerId);
    await fetchOffers();
  };

  const deleteOffer = async (offerId: string) => {
    await (supabase as any)
      .from("mentor_offers")
      .delete()
      .eq("id", offerId);
    await fetchOffers();
  };

  const contactMentor = async (offerId: string, mentorId: string) => {
    // Increment contact count
    await (supabase as any)
      .from("mentor_offers")
      .update({ contact_count: offers.find(o => o.id === offerId)?.contact_count ? (offers.find(o => o.id === offerId)!.contact_count + 1) : 1 })
      .eq("id", offerId);
    
    // Create a notification for the mentor
    if (user) {
      const { data: profile } = await supabase
        .from("profiles_public")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase.from("notifications").insert({
        user_id: mentorId,
        type: "mentor_request",
        title: "Demande de mentorat 🎓",
        body: `${profile?.display_name || "Un étudiant"} souhaite bénéficier de ton aide !`,
        data: { offer_id: offerId, requester_id: user.id },
      });
    }

    await fetchOffers();
  };

  return { offers, myOffers, loading, createOffer, toggleOffer, deleteOffer, contactMentor, isTemoin, refetch: fetchOffers };
}
