"use client";

import { useState } from "react";
import { completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ProfileForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");

  const bioLength = bio.length;
  const bioMin = 50;
  const bioMax = 500;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await completeOnboarding(formData);

    if (!result.success) {
      setError(result.error ?? "An error occurred");
      setLoading(false);
    }
    // If successful, the server action will redirect
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
        <CardDescription>
          Tell us about yourself to help us find your perfect match
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Your full name"
              required
              disabled={loading}
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="major">Major / Course</Label>
            <Input
              id="major"
              name="major"
              type="text"
              placeholder="e.g., Computer Science, Commerce, Medicine"
              required
              disabled={loading}
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself, your interests, hobbies, and what you're looking for in a study buddy or friend..."
              required
              disabled={loading}
              minLength={bioMin}
              maxLength={bioMax}
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="resize-none"
            />
            <div className="flex justify-between text-xs">
              <span
                className={
                  bioLength < bioMin
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {bioLength < bioMin
                  ? `${bioMin - bioLength} more characters needed`
                  : "Looks good!"}
              </span>
              <span
                className={
                  bioLength > bioMax
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {bioLength}/{bioMax}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || bioLength < bioMin || bioLength > bioMax}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Creating Profile..." : "Find My Match"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
