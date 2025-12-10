"use server";

import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validators";
import type { ActionResult, Message } from "@/types";

export async function sendMessage(
  matchId: string,
  content: string
): Promise<ActionResult<Message>> {
  // Validate input
  const validation = messageSchema.safeParse({ content });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  // Insert message (RLS will validate that user is part of the match)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from("messages") as any)
    .insert({
      match_id: matchId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("Send message error:", error);
    return {
      success: false,
      error: "Failed to send message. Please try again.",
    };
  }

  return {
    success: true,
    data: data as Message,
  };
}

export async function getMessages(matchId: string): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get messages error:", error);
    return [];
  }

  return data as Message[];
}
