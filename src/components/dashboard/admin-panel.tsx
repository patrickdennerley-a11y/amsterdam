"use client";

import { useState } from "react";
import { runBatchMatching } from "@/actions/matching";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Users, Shield } from "lucide-react";

interface AdminPanelProps {
  waitingCount: number;
}

export function AdminPanel({ waitingCount }: AdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleRunMatcher() {
    setLoading(true);
    setResult(null);

    const response = await runBatchMatching();

    if (response.success) {
      setResult({
        success: true,
        message: `Successfully created ${response.data} matches!`,
      });
    } else {
      setResult({
        success: false,
        message: response.error ?? "An error occurred",
      });
    }

    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Admin Panel
          </CardTitle>
          <Badge variant="outline" className="border-primary text-primary">
            Admin
          </Badge>
        </div>
        <CardDescription>
          Manage the matching algorithm and user pool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Waiting Users</span>
          </div>
          <span className="font-bold">{waitingCount}</span>
        </div>

        <Button
          onClick={handleRunMatcher}
          disabled={loading || waitingCount < 2}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          {loading ? "Running Matcher..." : "Run Batch Matching"}
        </Button>

        {waitingCount < 2 && (
          <p className="text-center text-xs text-muted-foreground">
            Need at least 2 waiting users to run matching
          </p>
        )}

        {result && (
          <div
            className={`rounded-lg p-3 text-sm ${
              result.success
                ? "bg-green-500/10 text-green-600"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
