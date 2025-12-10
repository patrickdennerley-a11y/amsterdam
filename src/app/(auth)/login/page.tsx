import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">UniMelb Match</h1>
        <p className="text-muted-foreground">Find your study buddy</p>
      </div>
      <LoginForm />
    </div>
  );
}
