"use client";
// coding-standard: maintained

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useEndSupportSession, useSupportSessions } from "@/services/api";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";

/**
 * The workspace's support-access history, newest first.
 *
 * Shared between the Settings page and nothing else today — but it is the
 * component that would be duplicated the moment support access appears anywhere
 * a second time, and it keeps the page itself a layout file.
 */

const formatWhen = (value?: string): string =>
  value ? new Date(value).toLocaleString() : "—";

/** How long they were in, in whole minutes — the number a merchant asks about. */
const formatDuration = (from?: string, to?: string): string | null => {
  if (!from || !to) return null;
  const minutes = Math.max(
    1,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000),
  );
  return `${minutes} min`;
};

const endedLabel = (session: {
  status: string;
  endedBy?: string;
}): string => {
  if (session.status === "active") return "In progress";
  if (session.endedBy === "merchant") return "You ended it";
  if (session.endedBy === "mc") return "Support ended it";
  if (session.endedBy === "expiry") return "Timed out";
  return session.status;
};

export function SupportSessionList() {
  const { data: sessions, isLoading } = useSupportSessions();
  const endSession = useEndSupportSession();

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = sessions ?? [];

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nobody at EzyCore has opened this workspace.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {rows.map((session) => {
        const duration = formatDuration(
          session.startedAt,
          session.endedAt ?? undefined,
        );
        return (
          <li
            key={session._id}
            className="flex flex-wrap items-start justify-between gap-3 py-3"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    session.status === "active" ? "default" : "secondary"
                  }
                >
                  {endedLabel(session)}
                </Badge>
                <span className="text-sm font-medium">
                  {session.mcUserEmail}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{session.reason}</p>
              <p className="text-xs text-muted-foreground">
                {formatWhen(session.startedAt)}
                {duration ? ` · ${duration}` : ""}
                {/* Pages viewed, not pages listed: the record is the fact and
                    extent of access, never a log of what was read — that would
                    be a second, far more sensitive thing to keep. */}
                {session.requestCount > 0
                  ? ` · ${session.requestCount} page${session.requestCount === 1 ? "" : "s"} viewed`
                  : ""}
              </p>
            </div>

            {session.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                disabled={endSession.isPending}
                onClick={() =>
                  endSession.mutate(session._id, {
                    onSuccess: () => toast.success("Support access ended"),
                    onError: () => toast.error("Could not end the session"),
                  })
                }
              >
                {endSession.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                End session
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
