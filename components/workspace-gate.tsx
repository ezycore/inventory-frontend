"use client";

import { getRootDomain, getSubdomain } from "@/lib/organization-utils";
import { Button } from "@ui/components/button";
import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Gate =
  | { kind: "ok" }
  | { kind: "notfound"; host: string }
  | { kind: "unavailable"; host: string };

interface OrgStatus {
  exists: boolean;
  status?: "active" | "inactive" | "read_only";
}

/**
 * Gates workspace subdomains (`<slug>.ezycore.com`). On a workspace host it checks
 * the org exists and isn't disabled via the public, cacheable status endpoint
 * (`GET /public/orgs/:slug/status`): unknown slug → "not found"; disabled →
 * "unavailable". Reserved/apex/`app`/localhost hosts return no subdomain, so they
 * skip the gate entirely.
 *
 * Two deliberate choices:
 *  - **Fail open** — any network/API error renders the app, so a transient backend
 *    blip never locks real workspaces out.
 *  - **Render children while checking** — only the rare negative result swaps the UI,
 *    so real users are never blocked behind a round-trip.
 *
 * See mission-control/docs/PRODUCT_ECOSYSTEM_ARCHITECTURE.md §9.
 */
export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<Gate>({ kind: "ok" });

  useEffect(() => {
    const slug = getSubdomain();
    if (!slug) return; // apex / app / reserved / localhost → no gate

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/public/orgs/${encodeURIComponent(slug)}/status`,
        );
        if (!res.ok) return; // fail open
        const json = (await res.json()) as { data?: OrgStatus };
        const data = json?.data;
        if (cancelled || !data) return;

        const host = window.location.hostname;
        if (!data.exists) {
          setGate({ kind: "notfound", host });
        } else if (data.status === "inactive") {
          setGate({ kind: "unavailable", host });
        }
        // active / read_only → leave the app rendered
      } catch {
        // fail open — a transient API error must not lock workspaces out
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (gate.kind === "ok") return <>{children}</>;

  const notFound = gate.kind === "notfound";
  const root = getRootDomain();
  const homeUrl = root ? `https://${root}` : "/";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {notFound ? "Workspace not found" : "Workspace unavailable"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {notFound ? (
            <>
              There&apos;s no workspace at{" "}
              <span className="font-medium text-foreground">{gate.host}</span>. Check
              the address, or head to our home page.
            </>
          ) : (
            <>
              The workspace at{" "}
              <span className="font-medium text-foreground">{gate.host}</span> is
              currently unavailable. Please contact your administrator.
            </>
          )}
        </p>
        <div className="mt-6">
          <Button asChild className="w-full">
            <a href={homeUrl}>Go to {root || "home"}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
