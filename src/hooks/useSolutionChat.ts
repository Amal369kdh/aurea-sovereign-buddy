import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SolutionConversation {
  id: string;
  announcement_id: string;
  comment_id: string;
  post_author_id: string;
  helper_id: string;
  post_author_msg_count: number;
  helper_msg_count: number;
}

export interface SolutionMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useSolutionChat(conversationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<SolutionConversation | null>(null);
  const [messages, setMessages] = useState<SolutionMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);

    const { data } = await supabase
      .from("solution_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (data) setConversation(data);

    const { data: msgs } = await supabase
      .from("solution_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { fetchConversation(); }, [fetchConversation]);

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`solution-${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "solution_messages", filter: `conversation_id=eq.${conversationId}` }, () => fetchConversation())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetchConversation]);

  const myMsgCount = user && conversation
    ? (conversation.post_author_id === user.id ? conversation.post_author_msg_count : conversation.helper_msg_count)
    : 0;

  const canSend = myMsgCount < 3;

  const sendMessage = async (content: string) => {
    if (!user || !conversationId || !canSend) return;
    const { error } = await supabase.from("solution_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message.includes("row-level") ? "Limite de 3 messages atteinte." : "Impossible d'envoyer.", variant: "destructive" });
    }
  };

  return { conversation, messages, loading, canSend, myMsgCount, sendMessage, refetch: fetchConversation };
}
