"use client";

/**
 * Phase 3.6b — Post-cutover MFA re-enrol banner.
 *
 * After the YoCore cutover (Phase 3.5), TOTP secrets are NOT migrated. Users
 * who previously used 2FA must re-enrol from scratch. This banner shows on
 * every authenticated page until the user either:
 *   1. Sets up 2FA (status `enabled` flips to true), or
 *   2. Dismisses it explicitly (per-user localStorage flag).
 *
 * The banner is also useful long-term as a gentle nudge for users who never
 * had 2FA — the dismissal makes that opt-in.
 */

import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { useTwoFactorStatusQuery } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "mfa-reenrol-dismissed:";

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function MfaReenrolBanner() {
  const { user } = useAuthStore();
  const { data: status, isSuccess } = useTwoFactorStatusQuery();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let flag: string | null = null;
    try {
      flag = localStorage.getItem(getStorageKey(user.id));
    } catch {
      flag = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: hydrate dismissed flag from localStorage once user.id is known
    setDismissed(flag === "true");
  }, [user?.id]);

  const handleDismiss = () => {
    if (!user?.id) return;
    try {
      localStorage.setItem(getStorageKey(user.id), "true");
    } catch {
      // localStorage may be unavailable (private mode, SSR fallback)
    }
    setDismissed(true);
  };

  if (!user?.id || !isSuccess || status?.enabled || dismissed) return null;

  return (
    <Alert className="mb-4 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <ShieldAlert className="h-4 w-4" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <AlertTitle>Set up two-factor authentication</AlertTitle>
          <AlertDescription className="text-sm">
            Your account is not protected by 2FA. If you previously had 2FA
            enabled, you will need to re-enrol after the recent authentication
            upgrade. We strongly recommend enabling it now.
          </AlertDescription>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            <Link href="/profile#2fa">Set up 2FA</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
