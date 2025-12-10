import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateProfileEmbedding } from "@/lib/voyage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, major, bio } = body;

    if (!name || !major || !bio) {
      return NextResponse.json(
        { error: "Missing required fields: name, major, bio" },
        { status: 400 }
      );
    }

    // Generate embedding
    const embedding = await generateProfileEmbedding(name, major, bio);

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error("Embedding API error:", error);
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }
}
