import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user's profile to determine redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("status, current_match_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          const { status, current_match_id } = profile;

          if (status === "matched" && current_match_id) {
            return NextResponse.redirect(`${origin}/chat/${current_match_id}`);
          } else if (status === "waiting") {
            return NextResponse.redirect(`${origin}/dashboard`);
          } else {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
