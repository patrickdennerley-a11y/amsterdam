"use client";

import { useEffect, useRef } from "react";
import { cn, formatTime, formatDate } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg font-medium">Start the conversation!</p>
          <p className="text-sm text-muted-foreground">
            Say hello to your new study buddy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-3">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {formatDate(date)}
            </span>
          </div>

          {/* Messages */}
          {dateMessages.map((message) => {
            const isOwn = message.user_id === currentUserId;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2",
                    isOwn
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-right text-xs",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
