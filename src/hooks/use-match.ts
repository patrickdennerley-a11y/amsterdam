"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MatchPartner } from "@/types";

export function useMatch(matchId: string | undefined, userId: string | undefined) {
  const [partner, setPartner] = useState<MatchPartner | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = useCallback(async () => {
    if (!matchId || !userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_match_partner", {
      p_match_id: matchId,
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching match:", error);
    } else if (data && data.length > 0) {
      setPartner(data[0] as MatchPartner);
    }
    setLoading(false);
  }, [matchId, userId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  return { partner, loading, refetch: fetchMatch };
}
