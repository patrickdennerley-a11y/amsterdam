"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, MatchPartner } from "@/types";

export async function unmatch(matchId: string): Promise<ActionResult> {
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

  // Call the unmatch_users RPC function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("unmatch_users", {
    p_match_id: matchId,
    p_requesting_user_id: user.id,
  });

  if (error) {
    console.error("Unmatch error:", error);
    return {
      success: false,
      error: "Failed to unmatch. Please try again.",
    };
  }

  if (!data) {
    return {
      success: false,
      error: "Unable to unmatch. You may not be part of this match.",
    };
  }

  redirect("/dashboard");
}

export async function getMatchPartner(
  matchId: string
): Promise<ActionResult<MatchPartner>> {
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

  // Call the get_match_partner RPC function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_match_partner", {
    p_match_id: matchId,
    p_user_id: user.id,
  });

  if (error) {
    console.error("Get match partner error:", error);
    return {
      success: false,
      error: "Failed to get match information.",
    };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: "Match not found or no longer active.",
    };
  }

  return {
    success: true,
    data: data[0] as MatchPartner,
  };
}

export async function runBatchMatching(): Promise<ActionResult<number>> {
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

  // Verify admin status using env var
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  // Use admin client for batch matching
  const adminSupabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminSupabase as any).rpc("run_batch_matching", {
    p_admin_email: user.email,
  });

  if (error) {
    console.error("Batch matching error:", error);
    return {
      success: false,
      error: `Batch matching failed: ${error.message}`,
    };
  }

  return {
    success: true,
    data: data as number,
  };
}

export async function getWaitingUsersCount(): Promise<number> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "waiting")
    .not("embedding", "is", null);

  return count ?? 0;
}
