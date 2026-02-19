import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Conversation {
  user_id: string;
  display_name: string;
  avatar_initials: string;
  is_verified: boolean;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  expires_at: string;
}

export function useMessages(selectedUserId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTemoin, setIsTemoin] = useState(false);

  // Check if current user is Témoin
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIsTemoin(data?.status === "temoin");
      });
  }, [user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get all messages involving the user
    const { data: allMessages, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
      return;
    }

    if (!allMessages || allMessages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by other user
    const convMap = new Map<string, { lastMsg: typeof allMessages[0]; count: number }>();
    for (const msg of allMessages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMsg: msg, count: 0 });
      }
    }

    // Fetch profiles for all conversation partners
    const userIds = [...convMap.keys()];
    if (userIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_initials, is_verified")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const convs: Conversation[] = userIds.map((uid) => {
      const { lastMsg } = convMap.get(uid)!;
      const profile = profileMap.get(uid);
      return {
        user_id: uid,
        display_name: profile?.display_name || "Anonyme",
        avatar_initials: profile?.avatar_initials || "??",
        is_verified: profile?.is_verified || false,
        last_message: lastMsg.content,
        last_message_at: lastMsg.created_at,
        unread_count: 0,
      };
    });

    convs.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setConversations(convs);
    setLoading(false);
  }, [user]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async () => {
    if (!user || !selectedUserId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching conversation:", error);
      return;
    }

    setMessages(data || []);
  }, [user, selectedUserId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchConversations();
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations, fetchMessages]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message.includes("row-level security")
          ? "Seuls les Témoins vérifiés peuvent envoyer des messages."
          : "Impossible d'envoyer le message.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return { conversations, messages, loading, isTemoin, sendMessage, refetch: fetchConversations };
}
