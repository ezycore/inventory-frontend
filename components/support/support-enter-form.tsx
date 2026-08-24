"use client";
// coding-standard: maintained

import { Loader2, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api-client";
import {
  useAuthStore,
  type User,
} from "@/services/stores/use-auth-store";
import type { ApiResponse } from "@/types";

/**
 * Redeems Mission Control's single-use hand-off code and signs the operator in
 * (`mission-control/plan/support-session.md` §5).
 *
 * Calls the exchange endpoint directly rather than through a TanStack hook: this
 * runs exactly once, before any session exists, and a cached or retried query
 * here would spend the one-use code on a request whose answer nobody reads.
 * The `redeemed` ref is the same concern in the other direction — React's strict
 * mode double-invokes effects in development, and the second call would always
 * fail, showing "expired or already used" on a link that was fine.
 */

interface ExchangeResponse {
  user: User;
  token: string;
  supportSession: { _id: string; reason: string; expiresAt: string };
}

/** The dead end, shared by both ways of getting there. */
function SupportEnterError({ message }: { message: string }) {
  return (
    <div className="space-y-3 rounded-lg border p-6 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">
        Open a new support session from Mission Control.
      </p>
    </div>
  );
}

export function SupportEnterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const setSupportSession = useAuthStore((s) => s.setSupportSession);
  const [error, setError] = useState<string | null>(null);
  const redeemed = useRef(false);

  const code = params.get("code");

  useEffect(() => {
    // A missing code is decided during render, not here — it is a property of
    // the URL, and setting state for it would be a cascading render for a fact
    // already known before the effect ran.
    if (!code || redeemed.current) return;
    redeemed.current = true;

    void (async () => {
      try {
        const res: ApiResponse<ExchangeResponse> = await apiClient.post(
          "/auth/support/exchange",
          { code },
        );
        const data = res.data;
        if (!data?.token || !data.user) {
          setError("This support link has expired or was already used.");
          return;
        }
        setSupportSession(data.user, data.token, data.supportSession._id);
        router.replace("/dashboard");
      } catch {
        // One message for every failure, matching the API: telling an unknown
        // code apart from a spent one would answer a question the visitor is
        // not entitled to ask.
        setError("This support link has expired or was already used.");
      }
    })();
  }, [code, router, setSupportSession]);

  if (!code) {
    return <SupportEnterError message="This support link is incomplete." />;
  }

  if (error) {
    return <SupportEnterError message={error} />;
  }

  return (
    <div className="space-y-3 p-6 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Starting support session…</p>
    </div>
  );
}
