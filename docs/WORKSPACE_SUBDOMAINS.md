# Per-Workspace Subdomains

> **This doc moved.** The canonical version is **`mission-control/docs/WORKSPACE_SUBDOMAINS.md`**.
>
> The subdomain feature spans all three repos — frontend routing (`lib/organization-utils.ts` + the
> middleware), backend auth (`src/services/auth.service.ts`, `src/models/organization.model.ts`,
> `src/controllers/auth.controller.ts`), and Mission Control provisioning — so it lives with the
> other cross-repo docs in MC.
>
> Until 2026-07-13 there was a **full copy in this repo and in MC**, each declaring itself "the
> authoritative, end-to-end reference", and they had already begun to drift: this copy documented
> `signupUrl()` and the MC copy did not. Two copies of a contract is how a contract stops being one.
> The `signupUrl()` line has been merged into the MC doc; this file is now a pointer.

## Frontend touch-points

| Concern | File |
|---|---|
| Subdomain detection, reserved list, URL builders (`getSubdomain`, `workspaceUrl`, `signupUrl`, `isReservedSubdomain`, `isValidOrganizationSlug`) | `lib/organization-utils.ts` |
| Slug → workspace routing | the Next.js middleware |
| Manual slug entry (on the apex and on reserved hosts) | the login + signup forms |

Related, and still in this repo: [`ORGANIZATION_SLUG_SYSTEM.md`](./ORGANIZATION_SLUG_SYSTEM.md) —
the slug-on-login mechanics (subdomain vs. manual slug field). Note it lists env vars
(`NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_SUBDOMAIN_ENABLED`, `NEXT_PUBLIC_MOCK_SUBDOMAIN`) that were
**never implemented**; the live behavior is the MC doc's.

Everything else — the reserved-subdomain set, the backend auth boundary, DNS/TLS, and how MC
provisions a workspace — is in the MC doc.
