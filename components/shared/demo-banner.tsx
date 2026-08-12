"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";
import { Button } from "@/ui/components/button";
import { authApi, useClearDemoData } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect } from "react";

/**
 * Demo banner shown across the app while the current workspace still holds
 * sample data. Lets the user wipe the demo data via a confirm dialog.
 *
 * Visibility is keyed on `demoSeedStatus`, which is set whenever a signup loaded
 * sample data — the signup switch, which is ON by default (`/signup?demo=false`
 * opts out; `?demo=true` forces it back on).
 * `clearSampleData` unsets the status, so the banner disappears once the data is
 * wiped. The workspace itself is a normal, permanent tenant throughout.
 */
export function DemoBanner() {
  const seedStatus = useAuthStore((s) => s.user?.organization?.demoSeedStatus);
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const clearDemo = useClearDemoData();

  const seeding = seedStatus === "seeding" || seedStatus === "pending";
  // Sample data is present (or being prepared) whenever the seed lifecycle is
  // active. After a successful clear the status is unset → banner hides.
  const hasSampleData = seeding || seedStatus === "ready";

  // While the background seed runs, poll /auth/me so the banner reflects "ready"
  // (and re-enables the clear button) without a manual refresh.
  useEffect(() => {
    if (!seeding || !token) return;
    let active = true;
    const timer = setInterval(async () => {
      try {
        const res = await authApi.me();
        if (active && res.data?.user) setUser(res.data.user, token);
      } catch {
        /* transient — keep polling */
      }
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [seeding, token, setUser]);

  if (!hasSampleData) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 shrink-0" />
        {seeding ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing your sample data…
          </span>
        ) : (
          <span>
            You&apos;re exploring with <strong>sample data</strong>. Clear it
            whenever you&apos;re ready to use this workspace for real.
          </span>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400 bg-transparent text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
            disabled={clearDemo.isPending || seeding}
          >
            {clearDemo.isPending && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            Clear sample data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all sample data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the demo products, stock, purchases, sales
              and payments from this workspace. Anything you created yourself is
              kept. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearDemo.mutate()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Clear sample data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
