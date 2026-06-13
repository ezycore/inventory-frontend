"use client";

import {
  getRootDomain,
  isValidOrganizationSlug,
  workspaceUrl,
} from "@/lib/organization-utils";
import { lookupWorkspace } from "@/lib/workspace-status-client";
import { LoginNotices } from "./login-notices";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Shown on the no-workspace host (apex / `app.ezycore.com`) when a root domain is
 * configured. Sessions are per-origin, so instead of logging in here we route the
 * user to their workspace subdomain and let them authenticate there once.
 */
export function WorkspaceChooser({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [slug, setSlug] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootDomain = getRootDomain();
  const signupUrl = rootDomain ? "https://app.ezycore.com/signup" : "/signup";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = slug.trim().toLowerCase();

    if (!isValidOrganizationSlug(normalized)) {
      setError(
        "Enter a valid workspace name (lowercase letters, numbers and hyphens).",
      );
      return;
    }

    setError(null);
    setIsChecking(true);
    const result = await lookupWorkspace(normalized);

    if (result.kind === "ok") {
      // Cross-origin hop — full page load to the workspace login.
      window.location.href = workspaceUrl(normalized, "/login");
      return; // keep the spinner while the browser navigates
    }

    setIsChecking(false);
    if (result.kind === "notfound") {
      setError("No workspace found with that name.");
    } else if (result.kind === "unavailable") {
      setError("This workspace is currently unavailable.");
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <LoginNotices />
      <Card>
        <CardHeader>
          <CardTitle>Find your workspace</CardTitle>
          <CardDescription>
            Enter your workspace name to continue to its sign-in page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="workspace">Workspace</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="workspace"
                    type="text"
                    placeholder="your-workspace"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    autoFocus
                    required
                  />
                  {rootDomain && (
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      .{rootDomain}
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isChecking}>
                {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isChecking ? "Checking..." : "Continue"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href={signupUrl} className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
