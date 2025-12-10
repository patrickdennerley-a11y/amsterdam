"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function useMessages(matchId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesRef = useRef<Message[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      const newMessages = data as Message[];
      setMessages(newMessages);
      messagesRef.current = newMessages;
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMessages();

    if (!matchId) return;

    const supabase = createClient();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.new) {
            const newMessage = payload.new as Message;
            // Check if message already exists to avoid duplicates
            if (!messagesRef.current.find((m) => m.id === newMessage.id)) {
              const updated = [...messagesRef.current, newMessage];
              messagesRef.current = updated;
              setMessages(updated);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchMessages]);

  const addOptimisticMessage = useCallback((message: Message) => {
    const updated = [...messagesRef.current, message];
    messagesRef.current = updated;
    setMessages(updated);
  }, []);

  return { messages, loading, refetch: fetchMessages, addOptimisticMessage };
}
