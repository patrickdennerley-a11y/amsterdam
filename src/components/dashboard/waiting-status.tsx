"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RadarAnimation } from "./radar-animation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Profile } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface WaitingStatusProps {
  userId: string;
  waitingCount: number;
}

export function WaitingStatus({ userId, waitingCount }: WaitingStatusProps) {
  const router = useRouter();
  const [count, setCount] = useState(waitingCount);

  // Check if user has been matched (used by both realtime and polling)
  const checkMatchStatus = useCallback(async () => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("status, current_match_id")
      .eq("id", userId)
      .single();

    if (profile?.status === "matched" && profile?.current_match_id) {
      router.push(`/chat/${profile.current_match_id}`);
      return true;
    }
    return false;
  }, [userId, router]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to own profile changes for match updates
    const profileChannel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          // Try to get status from payload first
          if (payload.new && (payload.new as Profile).status === "matched") {
            const matchId = (payload.new as Profile).current_match_id;
            if (matchId) {
              router.push(`/chat/${matchId}`);
              return;
            }
          }
          // Fallback: if payload doesn't have all fields, fetch from DB
          checkMatchStatus();
        }
      )
      .subscribe((status) => {
        // If subscription fails, rely more on polling
        if (status !== "SUBSCRIBED") {
          console.warn("Realtime subscription status:", status);
        }
      });

    // Subscribe to waiting users count changes
    const countChannel = supabase
      .channel("waiting-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        async () => {
          // Refetch count when profiles change
          const { count: newCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("status", "waiting")
            .not("embedding", "is", null);

          setCount(newCount ?? 0);
        }
      )
      .subscribe();

    // Polling fallback: check every 5 seconds in case realtime misses the update
    // This ensures users get redirected even if realtime fails
    const pollInterval = setInterval(() => {
      checkMatchStatus();
    }, 5000);

    // Also check immediately on mount in case already matched
    checkMatchStatus();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(countChannel);
      clearInterval(pollInterval);
    };
  }, [userId, router, checkMatchStatus]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Finding Your Match</CardTitle>
        <CardDescription>
          Our AI is scanning for compatible study buddies
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <RadarAnimation />

        <div className="flex items-center space-x-2 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span>{count} students waiting to be matched</span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          You&apos;ll be automatically connected when we find someone compatible.
          Feel free to leave this page - we&apos;ll notify you when matched!
        </p>
      </CardContent>
    </Card>
  );
}
