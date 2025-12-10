import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Sparkles, Shield } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to appropriate page
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
        redirect(`/chat/${current_match_id}`);
      } else if (status === "waiting") {
        redirect("/dashboard");
      } else {
        redirect("/onboarding");
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
            UniMelb Match
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Find your perfect study buddy at the University of Melbourne
          </p>
          <p className="mt-2 text-muted-foreground">
            AI-powered matching based on your interests and major
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Sparkles className="h-8 w-8" />}
            title="AI Matching"
            description="Advanced AI finds students with similar interests and goals"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="UniMelb Only"
            description="Exclusively for @student.unimelb.edu.au students"
          />
          <FeatureCard
            icon={<MessageCircle className="h-8 w-8" />}
            title="Real-time Chat"
            description="Connect instantly with your matched study buddy"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Safe & Secure"
            description="Your data is protected and never shared externally"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Built for UniMelb students, by UniMelb students</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
