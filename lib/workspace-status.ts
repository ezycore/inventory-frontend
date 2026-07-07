import { headers } from "next/headers";
import { hostImpliesWorkspace, subdomainFromHost } from "./organization-utils";

export type WorkspaceGate =
  | { kind: "ok" }
  | { kind: "notfound"; host: string }
  | { kind: "unavailable"; host: string };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface OrgStatus {
  exists: boolean;
  status?: "active" | "inactive" | "read_only";
}

/**
 * Resolve the workspace gate **server-side** from the request's `Host` header, so the
 * server renders the correct page directly — no flash of the app/login first, and no
 * client round-trip (that was the cause of the "login → not found" flicker).
 *
 * Apex / `app` / reserved / localhost hosts return `ok` (no gate). The result is
 * cached (`revalidate: 60`) so scanners probing the `*.ezycore.com` wildcard don't hit
 * the backend repeatedly. Fails OPEN on any error so a transient backend blip never
 * blocks real workspaces.
 *
 * See mission-control/docs/PRODUCT_ECOSYSTEM_ARCHITECTURE.md §9.
 */
export async function resolveWorkspaceGate(): Promise<WorkspaceGate> {
  const host = (await headers()).get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();
  const slug = subdomainFromHost(host);

  // Pick the status endpoint: workspace subdomain → by slug; custom domain →
  // by host. Platform apex / local (no implicit workspace) → no gate.
  let url: string;
  if (slug) {
    url = `${API_BASE}/public/orgs/${encodeURIComponent(slug)}/status`;
  } else if (hostImpliesWorkspace(hostname)) {
    url = `${API_BASE}/public/orgs/by-host/status?host=${encodeURIComponent(hostname)}`;
  } else {
    return { kind: "ok" };
  }

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { kind: "ok" }; // fail open
    const json = (await res.json()) as { data?: OrgStatus };
    const data = json?.data;
    if (!data) return { kind: "ok" };
    if (!data.exists) return { kind: "notfound", host };
    if (data.status === "inactive") return { kind: "unavailable", host };
    return { kind: "ok" }; // active / read_only
  } catch {
    return { kind: "ok" }; // fail open
  }
}
