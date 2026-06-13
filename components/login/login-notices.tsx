"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Mail, Shield } from "lucide-react";
import { useSearchParams } from "next/navigation";

/**
 * Auth notices driven by login URL params, shared by the login form and the
 * workspace chooser so they render on every login entry point (including the
 * no-workspace host, e.g. `app.ezycore.com/login?registered=true` after signup).
 */
export function LoginNotices() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const subscription = searchParams.get("subscription");

  return (
    <>
      {registered === "true" && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertDescription className="text-blue-800 dark:text-blue-400 ml-2">
            Account created successfully! Please check your email to verify your
            account before logging in.
          </AlertDescription>
        </Alert>
      )}
      {subscription === "inactive" && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription className="ml-2">
            No active subscription found.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
