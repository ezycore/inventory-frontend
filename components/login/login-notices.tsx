"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@ui/components/alert";
import { CheckCircle2, Mail, Shield } from "lucide-react";
import { useSearchParams } from "next/navigation";

/**
 * Auth notices driven by login URL params, shared by the login form and the
 * workspace chooser so they render on every login entry point (including the
 * no-workspace host, e.g. `app.ezycore.com/login?registered=true` after signup).
 */
export function LoginNotices() {
  const t = useTranslations("auth.notices");
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const subscription = searchParams.get("subscription");
  const reset = searchParams.get("reset");

  return (
    <>
      {reset === "success" && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertDescription className="text-green-800 dark:text-green-400 ml-2">
            {t("resetSuccess")}
          </AlertDescription>
        </Alert>
      )}
      {registered === "true" && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertDescription className="text-blue-800 dark:text-blue-400 ml-2">
            {t("registeredSuccess")}
          </AlertDescription>
        </Alert>
      )}
      {subscription === "inactive" && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {t("subscriptionInactive")}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
