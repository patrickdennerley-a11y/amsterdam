"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { sendMessage } from "@/actions/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import type { Message } from "@/types";

interface MessageInputProps {
  matchId: string;
  userId: string;
  onOptimisticMessage: (message: Message) => void;
}

export function MessageInput({
  matchId,
  userId,
  onOptimisticMessage,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxLength = 1000;
  const canSend = content.trim().length > 0 && content.length <= maxLength;

  async function handleSend() {
    if (!canSend || sending) return;

    const messageContent = content.trim();
    setSending(true);
    setContent("");

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      user_id: userId,
      content: messageContent,
      created_at: new Date().toISOString(),
    };
    onOptimisticMessage(optimisticMessage);

    // Send to server
    const result = await sendMessage(matchId, messageContent);

    if (!result.success) {
      // TODO: Handle error - could show toast or inline error
      console.error("Failed to send message:", result.error);
      // Could restore the message to input on failure
      setContent(messageContent);
    }

    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end space-x-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none pr-12"
            rows={1}
            maxLength={maxLength}
            disabled={sending}
          />
          {content.length > 0 && (
            <span
              className={`absolute bottom-2 right-2 text-xs ${
                content.length > maxLength
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {content.length}/{maxLength}
            </span>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={!canSend || sending}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
