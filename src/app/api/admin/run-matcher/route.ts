import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Verify admin access
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client for batch matching
    const adminSupabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase as any).rpc("run_batch_matching", {
      p_admin_email: user.email,
    });

    if (error) {
      console.error("Batch matching error:", error);
      return NextResponse.json(
        { error: `Batch matching failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ matchesCreated: data });
  } catch (error) {
    console.error("Admin matcher API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
