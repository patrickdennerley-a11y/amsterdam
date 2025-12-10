"use client";

import { useState } from "react";
import { unmatch } from "@/actions/matching";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, UserMinus } from "lucide-react";

interface UnmatchDialogProps {
  matchId: string;
  partnerName: string;
}

export function UnmatchDialog({ matchId, partnerName }: UnmatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnmatch() {
    setLoading(true);
    setError(null);

    const result = await unmatch(matchId);

    if (!result.success) {
      setError(result.error ?? "An error occurred");
      setLoading(false);
    }
    // If successful, the server action will redirect
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
        <UserMinus className="h-5 w-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unmatch with {partnerName}?</DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              Are you sure you want to unmatch? This will:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>End your current conversation</li>
              <li>Return both of you to the waiting pool</li>
              <li className="font-medium text-destructive">
                You will NEVER be matched with {partnerName} again
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnmatch}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unmatch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
