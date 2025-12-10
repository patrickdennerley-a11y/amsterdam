import { ProfileForm } from "@/components/onboarding/profile-form";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">UniMelb Match</h1>
        <p className="text-muted-foreground">Let&apos;s get to know you</p>
      </div>
      <ProfileForm />
    </div>
  );
}
