# Per-Workspace Subdomains

How an EasyStock workspace gets its own subdomain (`acme.ezycore.com`), how users
sign up on the apex and are handed off to that subdomain, and everything needed to
run it in production.

> **Scope.** This is the authoritative, end-to-end reference for the subdomain
> feature across the **frontend**, **backend**, and **infra** repos.
> - [`ORGANIZATION_SLUG_SYSTEM.md`](./ORGANIZATION_SLUG_SYSTEM.md) covers the original
>   slug-on-login mechanics (subdomain vs. manual slug field). Some env vars it lists
>   (`NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_SUBDOMAIN_ENABLED`, `NEXT_PUBLIC_MOCK_SUBDOMAIN`)
>   were never implemented — the live behavior is described here.
> - `mission-control/docs/DEPLOYMENT.md` **§17** is the infra design doc this implements.

---

## 1. The model

| Host | Serves |
|------|--------|
| `ezycore.com` / `www.ezycore.com` (apex) | Landing + **signup / login** (no workspace context) |
| `<workspace>.ezycore.com` | The product, **scoped to that workspace** (production tenants) |
| `rc.ezycore.com` | Frontend — **shared staging** (single host, no wildcard) |
| `api.ezycore.com` / `rc-api.ezycore.com` | Backend (single host per env) |
| `mc.ezycore.com` / `mc-api.ezycore.com` | Mission Control admin / API |

**Reserved (never a workspace):** `www`, `app`, `api`, `mc`, `mc-api`, `rc`, `rc-*`,
`admin`, `assets`, `static` (backend also reserves `mail`, `smtp`, `ftp`, `ns`, `ns1`, `ns2`).

Key architecture decisions:

- **The backend stays single-host** (`api.ezycore.com`). It is already multi-tenant via
  the JWT's `organizationId`, so there are no per-tenant API subdomains. Only the
  **frontend** is served per-workspace.
- **Subdomain → workspace resolution is client-side.** The frontend reads
  `window.location.hostname` in the browser; there is **no Next.js `middleware.ts`**
  for this.
- **Sessions are per-origin.** A login on `acme.ezycore.com` is isolated from
  `shopx.ezycore.com` — intended (workspace isolation). The signup/verify → workspace
  handoff is therefore a **fresh login on the subdomain**, not a cross-origin session
  transfer. (For true SSO you could set the auth cookie `Domain=.ezycore.com`, at the
  cost of widening its blast radius — not done.)

---

## 2. End-to-end flow

```
                          apex: ezycore.com  (or rc.ezycore.com in staging)
  ┌──────────┐  signup    ┌────────────────────────────┐
  │  Visitor │ ─────────► │ POST api.ezycore.com         │  creates org(slug)+owner,
  └──────────┘            │      /api/auth/signup        │  rejects reserved slugs,
        ▲                 └───────────────┬──────────────┘  sends verification email
        │                                 │
        │  /login?registered=true  ◄──────┘  (frontend: "check your email")
        │
        │  email link → FRONTEND_URL/verify-email?token=…&org=<slug>
        ▼
  ┌────────────────────────────┐  verify ok   "Go to Login" →
  │ <signup host>/verify-email  │ ───────────► https://<slug>.ezycore.com/login
  └────────────────────────────┘                         │
                                                          ▼
                              ┌─────────────────────────────────────────────┐
                              │ <slug>.ezycore.com  → getSubdomain() = slug  │
                              │ login form auto-scopes (slug field hidden)   │
                              │ fresh per-origin session → /dashboard        │
                              └─────────────────────────────────────────────┘
```

1. **Signup** on the apex (or `rc.` in staging). The form posts to the backend, which
   creates the organization (with its `slug`) and the owner user, **rejects reserved
   slugs**, and emails a verification link. The link points at `FRONTEND_URL` and
   already carries the slug as `&org=<slug>`.
2. Frontend redirects to `/login?registered=true` ("check your email") — the user
   **cannot log in until verified**, so there is intentionally no subdomain hop yet.
3. **Verify** — the user clicks the email link, landing on the signup host's
   `/verify-email?token=…&org=<slug>`. On success the **"Go to Login" button points at
   the workspace**: `https://<slug>.ezycore.com/login`.
4. **Login** on the workspace subdomain. `getSubdomain()` returns the slug, the login
   form hides the manual slug field and auto-scopes the request, and a fresh session is
   established on that origin. The user lands on `/dashboard` with the workspace's
   features.

---

## 3. Frontend

### Subdomain detection & URL helpers — `lib/organization-utils.ts`

```typescript
getSubdomain(): string | null            // window.location.hostname → slug, or null
isSubdomainMode(): boolean
getOrganizationSlug(): string | null
withOrganizationSlug(formData, manualSlug?)  // adds organizationSlug (subdomain wins)
shouldShowOrganizationSlugField(): boolean   // true when NOT in subdomain mode

RESERVED_SUBDOMAINS: Set<string>         // www, app, api, mc, mc-api, rc, admin, assets, static
isReservedSubdomain(sub): boolean        // reserved set OR sub.startsWith("rc-")

getRootDomain(): string                  // NEXT_PUBLIC_ROOT_DOMAIN, "" when unset
workspaceUrl(slug, path="/"): string     // https://<slug>.<root><path>, or relative when no root
signupUrl(): string                      // https://app.<root>/signup, or /signup when no root

isValidOrganizationSlug(slug): boolean   // ^[a-z0-9]+(?:-[a-z0-9]+)*$
generateSlugFromName(name): string
```

- `getSubdomain()` returns `null` for `localhost`/IPs, for apex (fewer than 3 host
  labels), and for any **reserved** subdomain. So on `rc.ezycore.com` the app runs in
  "no workspace" mode and the **manual slug field shows** — that is what makes the
  shared staging host usable as a signup/login page.
- `workspaceUrl()` returns a **relative path** when `NEXT_PUBLIC_ROOT_DOMAIN` is unset
  (local dev / staging) or when called server-side, so callers work unchanged in both
  modes. When set, it returns an absolute, cross-origin URL — navigate to it with a full
  page load (`<a>` / `window.location`), never the client router.

### Where it's used

| File | Role |
|------|------|
| `components/login/login-form.tsx` | Uses `shouldShowOrganizationSlugField()` + `withOrganizationSlug()`. |
| `app/(auth)/signup/page.tsx` | Collects `organizationName` + `organizationSlug` (format-validated); reads `planName`/`planSlug` from the URL (ties to MC plans). |
| `app/(auth)/verify-email/page.tsx` | Reads `org` from the URL; success button → `workspaceUrl(org, "/login")`. |
| `app/(auth)/forgot-password/page.tsx`, `resend-verification/page.tsx` | Conditional slug field via the same helpers. |
| `services/api/modules/auth/hooks.ts` | `useSignupAPi` → `/login?registered=true`; `useLogin` → `/dashboard`; `useVerifyEmail`. |

### Build-time configuration

`NEXT_PUBLIC_ROOT_DOMAIN` is a **`NEXT_PUBLIC_*` var — baked at build time**, not read
at runtime (see `DEPLOYMENT.md` §10.1).

- `.env.example` → `ezycore.com`; `.env.local` → empty (local dev = relative/manual-slug).
- `Dockerfile` declares `ARG/ENV NEXT_PUBLIC_ROOT_DOMAIN`.
- `.github/workflows/deploy.yml` bakes `NEXT_PUBLIC_ROOT_DOMAIN=ezycore.com` for the
  `main` (production) build and **empty for staging** (staging has no wildcard, so it
  intentionally stays in manual-slug mode).

---

## 4. Backend (`easystock-backend`)

Single-host, multi-tenant by `organizationSlug`.

| File | Role |
|------|------|
| `src/models/organization.model.ts` | `slug`: required, `unique`, lowercased. |
| `src/controllers/auth.controller.ts` | `login` / `verify-email` / `forgot-password` / `resend-verification` accept `organizationSlug`. |
| `src/services/auth.service.ts` | `signup` creates org+owner, **guards reserved slugs** then checks slug uniqueness; `login` scopes the user query by slug. |
| `src/constants/reserved-slugs.ts` | `RESERVED_ORG_SLUGS` + `isReservedSlug()` (mirrors the frontend list, plus mail/DNS hosts). |
| `src/services/email.service.ts` | Verification URL = `${FRONTEND_URL}/verify-email?token=…&org=<slug>`. |
| `src/server.ts` | CORS allow-list (below). |

**Reserved-slug guard** — signup rejects reserved names before the DB lookup:

```typescript
if (isReservedSlug(sanitized.organizationSlug!)) {
  throw new ValidationError(
    `"${sanitized.organizationSlug}" is a reserved name and cannot be used as an organization slug`,
    "ORG_SLUG_RESERVED",   // HTTP 422
  );
}
```

**CORS** (`server.ts`) — allows the explicit `CORS_ORIGIN`, the `*.localhost:3000` dev
rule, and (when `ROOT_DOMAIN` is set) the apex + any single-level workspace subdomain
over https:

```
^https:\/\/([a-z0-9-]+\.)?<ROOT_DOMAIN>$
```

`ROOT_DOMAIN` is a **runtime** env (set on the server, e.g. `ezycore.com`); empty disables
the rule. Without it, `acme.ezycore.com → api.ezycore.com` calls are CORS-blocked.

> The verification email is sent to `FRONTEND_URL` — point it at the **signup host**
> (e.g. `https://rc.ezycore.com` in staging) so the verify page lands there before the
> workspace handoff.

---

## 5. Infra (`easystock-infra`) — wildcard routing & TLS

Tenant subdomains route to the production frontend via a Caddy wildcard block, with a
**wildcard TLS certificate issued through Cloudflare DNS-01** (chosen over on-demand TLS:
one cert covers unlimited workspaces, no Let's Encrypt rate-limit exposure).

| File | Change |
|------|--------|
| `infra/Caddyfile` | `ezycore.com, www` apex block + `*.ezycore.com` wildcard block → `frontend-prod:3000`. Explicit hosts win over the wildcard. |
| `infra/Dockerfile` | Custom Caddy = `caddy:2` + `github.com/caddy-dns/cloudflare` via `xcaddy`. |
| `infra/docker-compose.yml` | Caddy `build: .` and passes `CLOUDFLARE_API_TOKEN`. |
| `templates/backend.env.example` | `ROOT_DOMAIN=ezycore.com`. |
| `templates/infra.env.example` | Documents `CLOUDFLARE_API_TOKEN` (scoped token). |

Caddyfile wildcard block:

```
*.ezycore.com {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    reverse_proxy frontend-prod:3000
}
```

The wildcard cert `*.ezycore.com` does **not** cover the apex — `ezycore.com`/`www` get
their own certs via HTTP-01 from their explicit block.

### Production deployment checklist

1. **DNS** (Cloudflare): A records → server IP for `@` (apex), `www`, and `*` (wildcard).
   Most-specific wins, so existing `api`/`mc`/`rc` records are unaffected.
2. **Cloudflare token**: create a scoped token (Zone → DNS → Edit, restricted to the
   `ezycore.com` zone). Put it in `/opt/easystock/infra/.env` as `CLOUDFLARE_API_TOKEN=…`.
3. **Backend env**: set `ROOT_DOMAIN=ezycore.com` in `/opt/easystock/production/.env.backend`.
4. **Rebuild + redeploy**:
   - Caddy: `cd /opt/easystock/infra && docker compose up -d --build` (compiles the plugin).
   - Frontend: deploy `main` so the prod image bakes `NEXT_PUBLIC_ROOT_DOMAIN`.
   - Backend: restart with the new `ROOT_DOMAIN`.

---

## 6. Environments

| | Apex / signup host | `NEXT_PUBLIC_ROOT_DOMAIN` (frontend build) | Backend `ROOT_DOMAIN` | Workspace login |
|---|---|---|---|---|
| **Local** | `localhost:3000` | empty | empty | manual slug field (`*.localhost:3000` allowed by CORS) |
| **Staging** | `rc.ezycore.com` | empty | `ezycore.com` | manual slug field on `rc.` (no wildcard) |
| **Production** | `ezycore.com` | `ezycore.com` | `ezycore.com` | `<slug>.ezycore.com` (auto-scoped) |

Staging deliberately keeps `NEXT_PUBLIC_ROOT_DOMAIN` empty: there is no `*.rc` wildcard,
so after verifying on `rc.ezycore.com` the user stays there and logs in via the manual
slug field. This exercises the whole flow without a staging wildcard.

---

## 7. Local development & testing

- `localhost` returns no subdomain → manual slug field shows; enter the slug to log in.
- To exercise true subdomain mode locally, use `*.localhost` (e.g. `acme.localhost:3000`,
  which Chrome resolves and the backend CORS already allows) or a hosts-file entry.
- **Signup**: try slug `rc` (or `api`, `mc`) → expect **422 `ORG_SLUG_RESERVED`**; then a
  real slug like `acme` succeeds.

---

## 8. Security notes

- Organization slug is validated server-side regardless of source (subdomain or manual).
- Reserved slugs are rejected on signup so a tenant can't claim an infra host.
- Per-origin sessions isolate workspaces; the apex/verify → workspace handoff is a fresh
  login, never a cross-origin token transfer.
- Login is organization-scoped (user must exist within the resolved org), which avoids
  cross-organization user enumeration.

---

## 9. Status

- **Phase A — app logic (done):** reserved-subdomain handling, `getRootDomain()` /
  `workspaceUrl()`, verify → workspace handoff, backend reserved-slug guard.
- **Phase B — infra (code/config done):** backend CORS for apex + `*.ROOT_DOMAIN`,
  Caddy apex + wildcard blocks, custom Caddy image, `NEXT_PUBLIC_ROOT_DOMAIN` build wiring.
  Remaining work is operational: DNS records, Cloudflare token, server env, rebuild/redeploy
  (see §5).
