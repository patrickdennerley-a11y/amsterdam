"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useMessages } from "@/hooks/use-messages";
import { useMatch } from "@/hooks/use-match";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const { user, loading: userLoading } = useUser();
  const { partner, loading: partnerLoading } = useMatch(matchId, user?.id);
  const { messages, loading: messagesLoading, addOptimisticMessage } = useMessages(matchId);

  // Subscribe to match becoming inactive (unmatch)
  useEffect(() => {
    if (!matchId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new && !(payload.new as { is_active: boolean }).is_active) {
            // Match was deactivated, redirect to dashboard
            router.push("/dashboard");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, router]);

  const loading = userLoading || partnerLoading || messagesLoading;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !partner) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Match not found or no longer active</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-primary hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader partner={partner} matchId={matchId} />
      <MessageList messages={messages} currentUserId={user.id} />
      <MessageInput
        matchId={matchId}
        userId={user.id}
        onOptimisticMessage={addOptimisticMessage}
      />
    </div>
  );
}
