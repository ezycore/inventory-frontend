"use client";
// coding-standard: maintained

import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useEndOwnSupportSession,
  useEndSupportSession,
  useSupportSessions,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";

/**
 * Shown across the whole app whenever someone at EzyCore is inside this
 * workspace (`mission-control/plan/support-session.md` §5).
 *
 * **This banner is not decoration — it is the reason support access can ship
 * without asking the merchant's permission first.** The design deliberately has
 * no opt-out toggle; what it promises instead is that access is read-only,
 * time-boxed, on the permanent record, visible while it happens, and stoppable.
 * The last two are this component. If it silently stopped rendering, the honest
 * description of the product would change to "EzyCore staff can read your
 * workspace without telling you", which is a different thing to sell.
 *
 * One component, two audiences:
 *
 * - the **merchant** sees who is in their workspace, why, and an "End session"
 *   button;
 * - the **support operator** sees their own remaining time and a way out.
 */

/**
 * A clock that ticks while `active`.
 *
 * The countdown is DERIVED from this during render rather than stored in state
 * of its own. Keeping the label in state meant writing to it from inside the
 * effect, which cascades a render and — worse — goes stale the moment
 * `expiresAt` changes to a different session's. One number in, one label out.
 */
const useNow = (active: boolean): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  return now;
};

/** mm:ss remaining, or null once it has run out. */
const remainingLabel = (now: number, expiresAt?: string): string | null => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function SupportSessionBanner() {
  const ownSessionId = useAuthStore((s) => s.supportSessionId);
  const { data: sessions } = useSupportSessions();
  const endSession = useEndSupportSession();
  const endOwn = useEndOwnSupportSession();

  const live = (sessions ?? []).filter((s) => s.status === "active");
  const own = live.find((s) => s._id === ownSessionId);
  // The operator sees their own session; the merchant sees whoever is in.
  const session = own ?? live[0];
  // Hooks run unconditionally — the tick is only armed when there is something
  // to count down.
  const now = useNow(Boolean(session));
  const remaining = remainingLabel(now, session?.expiresAt);

  if (!session) return null;

  const isOperator = Boolean(own);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-300 bg-sky-50 px-4 py-2 text-sky-900 dark:border-sky-700/60 dark:bg-sky-950/40 dark:text-sky-200">
      <div className="flex items-center gap-2 text-sm">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        {isOperator ? (
          <span>
            <strong>Read-only support session.</strong> Nothing here can be
            changed{remaining ? `. Ends in ${remaining}` : ""}.
          </span>
        ) : (
          <span>
            <strong>EzyCore support ({session.mcUserEmail})</strong> is viewing
            your workspace, read-only. {session.reason}
          </span>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="border-sky-400 bg-transparent text-sky-900 hover:bg-sky-100 dark:text-sky-100 dark:hover:bg-sky-900/40"
        disabled={endSession.isPending || endOwn.isPending}
        onClick={() => {
          if (isOperator) {
            endOwn.mutate(undefined, {
              // The token is dead the moment this returns, so the hook clears
              // the local session; say so before the app bounces to /login.
              onSuccess: () => toast.success("Support session ended"),
              onError: () => toast.error("Could not end the session"),
            });
            return;
          }
          endSession.mutate(session._id, {
            onSuccess: () => toast.success("Support access ended"),
            onError: () => toast.error("Could not end the session"),
          });
        }}
      >
        {(endSession.isPending || endOwn.isPending) && (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        )}
        End session
      </Button>
    </div>
  );
}
