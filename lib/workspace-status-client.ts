/**
 * Client-side workspace lookup.
 *
 * Calls the public, cached `GET /api/public/orgs/:slug/status` endpoint so the
 * apex/`app` login page can validate a workspace slug before handing the user
 * off to `<slug>.<root>/login`. The server-side equivalent (`resolveWorkspaceGate`
 * in `./workspace-status.ts`) gates the workspace host itself; this one runs in
 * the browser on the no-workspace host, so it cannot import `next/headers`.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type WorkspaceLookup =
  | { kind: "ok"; status: "active" | "read_only" }
  | { kind: "notfound" }
  | { kind: "unavailable" }
  | { kind: "error" };

export async function lookupWorkspace(slug: string): Promise<WorkspaceLookup> {
  try {
    const res = await fetch(
      `${API_BASE}/public/orgs/${encodeURIComponent(slug)}/status`,
    );
    if (!res.ok) return { kind: "error" };
    const json = (await res.json()) as {
      data?: { exists: boolean; status?: "active" | "inactive" | "read_only" };
    };
    const data = json?.data;
    if (!data?.exists) return { kind: "notfound" };
    if (data.status === "inactive") return { kind: "unavailable" };
    return { kind: "ok", status: data.status ?? "active" };
  } catch {
    return { kind: "error" };
  }
}

/** One workspace an email belongs to, as returned by the finder endpoint. */
export interface FoundWorkspace {
  name: string;
  slug: string;
  logoUrl: string | null;
}

export type WorkspaceEmailLookup =
  | { kind: "ok"; workspaces: FoundWorkspace[] }
  | { kind: "ratelimited" }
  | { kind: "error" };

/**
 * Email → workspaces lookup for the apex "find your workspace" flow. Calls the
 * public, rate-limited `POST /api/auth/find-workspaces` endpoint; multi-workspace
 * emails get every active workspace back so the chooser can offer a pick list.
 */
export async function findWorkspacesByEmail(
  email: string,
): Promise<WorkspaceEmailLookup> {
  try {
    const res = await fetch(`${API_BASE}/auth/find-workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.status === 429) return { kind: "ratelimited" };
    if (!res.ok) return { kind: "error" };
    const json = (await res.json()) as {
      data?: { workspaces?: FoundWorkspace[] };
    };
    return { kind: "ok", workspaces: json?.data?.workspaces ?? [] };
  } catch {
    return { kind: "error" };
  }
}
