import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WaitingStatus } from "@/components/dashboard/waiting-status";
import { AdminPanel } from "@/components/dashboard/admin-panel";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get waiting users count
  const { count: waitingCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "waiting")
    .not("embedding", "is", null);

  // Check if user is admin
  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  return (
    <div className="flex min-h-screen flex-col items-center p-4">
      {/* Header */}
      <div className="flex w-full max-w-md items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold text-primary">UniMelb Match</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="icon" type="submit">
            <LogOut className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center space-y-6">
        <WaitingStatus userId={user.id} waitingCount={waitingCount ?? 0} />

        {isAdmin && <AdminPanel waitingCount={waitingCount ?? 0} />}
      </div>
    </div>
  );
}
