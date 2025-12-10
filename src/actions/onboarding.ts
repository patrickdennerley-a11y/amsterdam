"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateProfileEmbedding } from "@/lib/voyage";
import { onboardingSchema } from "@/lib/validators";
import type { ActionResult } from "@/types";

export async function completeOnboarding(
  formData: FormData
): Promise<ActionResult> {
  const fullName = formData.get("full_name") as string;
  const major = formData.get("major") as string;
  const bio = formData.get("bio") as string;

  // Validate input
  const validation = onboardingSchema.safeParse({
    full_name: fullName,
    major,
    bio,
  });

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

  // Generate embedding using Voyage AI
  let embedding: number[];
  try {
    embedding = await generateProfileEmbedding(fullName, major, bio);
  } catch (error) {
    console.error("Embedding generation error:", error);
    return {
      success: false,
      error: "Failed to generate profile embedding. Please try again.",
    };
  }

  // Format embedding for pgvector (as string array)
  const embeddingString = `[${embedding.join(",")}]`;

  // Update profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      full_name: fullName,
      major,
      bio,
      embedding: embeddingString,
      status: "waiting",
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: "Failed to save profile. Please try again.",
    };
  }

  redirect("/dashboard");
}

export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const fullName = formData.get("full_name") as string;
  const major = formData.get("major") as string;
  const bio = formData.get("bio") as string;

  // Validate input
  const validation = onboardingSchema.safeParse({
    full_name: fullName,
    major,
    bio,
  });

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

  // Generate new embedding
  let embedding: number[];
  try {
    embedding = await generateProfileEmbedding(fullName, major, bio);
  } catch (error) {
    console.error("Embedding generation error:", error);
    return {
      success: false,
      error: "Failed to generate profile embedding. Please try again.",
    };
  }

  const embeddingString = `[${embedding.join(",")}]`;

  // Update profile (keep status as-is)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      full_name: fullName,
      major,
      bio,
      embedding: embeddingString,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: "Failed to save profile. Please try again.",
    };
  }

  return { success: true };
}
