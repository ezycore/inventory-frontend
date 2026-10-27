// coding-standard: maintained
import { getRootDomain } from "@/lib/organization-utils";

/**
 * The 404 for a subdomain no workspace owns. Self-contained HTML rather than a
 * rendered route — rendering anything is exactly the cost being refused — but a
 * merchant who mistypes their address still gets the gate screen's words and a
 * way home (`components/workspace-gate-screen.tsx`). The host is left out: it is
 * attacker-chosen, and echoing it would need escaping for no gain.
 */
export const workspaceNotFoundHtml = (): string => {
  const root = getRootDomain();
  const home = root ? `https://${root}` : "/";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Workspace not found</title></head><body style="margin:0;min-height:100svh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fff;color:#111"><main style="max-width:28rem;margin:1.5rem;padding:2rem;border:1px solid #e5e5e5;border-radius:1rem;text-align:center"><h1 style="margin:0;font-size:1.5rem">Workspace not found</h1><p style="margin:.75rem 0 1.5rem;font-size:.875rem;color:#666">There&apos;s no workspace at this address. Check the address, or head to our home page.</p><a href="${home}" style="display:block;padding:.625rem 1.25rem;border-radius:.5rem;background:#111;color:#fff;text-decoration:none;font-size:.875rem;font-weight:600">Go to ${root || "home"}</a></main></body></html>`;
};
