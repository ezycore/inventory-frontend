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
