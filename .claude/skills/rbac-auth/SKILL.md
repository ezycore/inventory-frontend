---
name: rbac-auth
description: 'RBAC, feature gates and session handling on the FRONTEND — permission-based UI gating, the auth store, feature-flag helpers, subscription/billing enforcement, and the role/permission editors. USE WHEN: hiding/showing UI by permission (`useHasPermission`, `costs.view`, `users.manage`), gating a module by plan feature (`isFeatureEnabled`), a page that should force-logout or show an overdue banner, "button visible but 403 on click" / "nav item missing" / "logged out unexpectedly" / "workspace blocked", editing roles or the permissions matrix, or reading `user.permissions` / `user.organization.features`. Touches `easystock-frontend/{services/stores/use-auth-store.ts,hooks/use-has-permission.ts,lib/feature-utils.ts,lib/subscription-utils.ts,components/shared/permissions,app/(protected)/layout.tsx,components/profile/permissions-tab.tsx,services/api/modules/{roles,users}}`. The BACKEND owns the real gates (authenticate → checkPermission → requireFeature, org scoping) — read `easystock-backend/.claude/skills/rbac-auth/SKILL.md`; this file does not duplicate it.'
---

# RBAC & Auth Skill (Frontend)

The frontend gates are **UI affordances only** — they hide what a user can't do so the app reads
correctly. The real enforcement is server-side. Never treat an FE permission check as security.

> **The three server gates (authenticate → permission → feature), roles, and org/location scoping**
> live in [`easystock-backend/.claude/skills/rbac-auth/SKILL.md`](../../../../easystock-backend/.claude/skills/rbac-auth/SKILL.md).
> If a button is hidden here but the endpoint is still reachable, that is by design — the backend is the
> gate. If a user *has* the permission but gets 403, the bug is on the backend side.

---

## 1. Permission gating

- **`useHasPermission(permission)`** ([`hooks/use-has-permission.ts`](../../../hooks/use-has-permission.ts))
  reads `user.permissions` from the auth store and returns a boolean. The `PERMISSIONS` const there
  mirrors the backend catalog (`easystock-backend/src/constants/permissions.ts`) — the two known
  strings today are `costs.view` (COGS/unit-cost figures) and `users.manage` (user admin + the Roles
  settings page). **Never hardcode a permission string** in a component — add it to `PERMISSIONS`.
- Permission strings are `resource.action`. Display helpers (grouping, action icons, category colors)
  and the `PermissionGroupCard` category card live in
  [`components/shared/permissions/`](../../../components/shared/permissions) — reuse them; don't
  re-derive category colors or action icons. Used by the profile Permissions tab
  ([`components/profile/permissions-tab.tsx`](../../../components/profile/permissions-tab.tsx)) and
  Settings → Roles.

---

## 2. The auth store — the source of the session

[`services/stores/use-auth-store.ts`](../../../services/stores/use-auth-store.ts) (Zustand, persisted to
`localStorage` as `easystock-auth`) holds the user, token and `activeLocationId`. It **syncs the JWT to
a cookie (`auth-token`) and the active location to a cookie (`active-location`)** so the Next.js
middleware can read them server-side. Switching location calls `setActiveLocation`, which flows into
every request via the `X-Active-Location` header in `lib/api-client.ts`.

> **Hydration:** any component reading the persisted auth (or cart/shopper) store on first render must
> gate on `useHydrated()` (`hooks/use-hydrated.ts`) so the first client render matches the SSR HTML —
> otherwise you flash the signed-out state at signed-in users, or trigger redirect races. Never hand-roll
> `typeof window` / `useSyncExternalStore`.

---

## 3. Feature gates (plan features)

[`lib/feature-utils.ts`](../../../lib/feature-utils.ts) reads `user.organization.features`:

- `isFeatureEnabled(org, key)` / `areAllFeaturesEnabled` / `isAnyFeatureEnabled` — gate a module/nav item.
- `isTaxActive(org, "sales" | "purchase")` — the tax surfaces (see the tax conventions in CLAUDE.md).
- `FEATURE`, `getFeatureDisplayNames`, `getFeatureDescriptions` — labels for the plan/settings UI.

`OrganizationFeatures` is the org's plan ceiling ANDed with overrides on the backend; the FE just reads
the resolved `features`. A hidden nav item is UI-only — the backend still enforces (or, for a few keys
like `sales`, notably does **not** — see the BE skill's gap notes before assuming a hidden module is
secured).

---

## 4. Subscription / billing enforcement

[`lib/subscription-utils.ts`](../../../lib/subscription-utils.ts) mirrors the backend
`entitlementAccess` 3-tier classifier — **keep the two in sync**:

- `classifyEntitlementAccess()` → `active | read_only | blocked`.
- `shouldBlockWorkspaceAccess()` — the protected layout
  ([`app/(protected)/layout.tsx`](../../../app/(protected)/layout.tsx)) force-logs-out only `blocked`
  orgs (to `/login?subscription=inactive`). `read_only` (past-due) is **let through** so the user can
  reach billing and pay.
- `isPaymentOverdue()` — drives the overdue banner + "Pay now".
- `getScheduledPlanChange()` — the scheduled-downgrade banner.

The protected layout verifies the session via `useMe()` on every mount and checks subscription status
there — do not add a second, divergent gate.

---

## 5. Roles & users

[`services/api/modules/roles`](../../../services/api/modules/roles) and
[`services/api/modules/users`](../../../services/api/modules/users) back the Settings → Roles editor and
user admin (both behind `users.manage`). A role is a named permission set; editing it changes what
`user.permissions` contains on next login. Use the shared permissions components (§1) to render the
matrix — never re-list permission strings by hand.

---

## 6. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Button visible but 403 on click | FE gate missing OR user genuinely lacks the perm | add `useHasPermission(...)`; if they *have* it, it's a backend bug |
| Nav item missing for a feature | feature flag off for the org | check `isFeatureEnabled(org, key)`; it's plan-controlled |
| Flash of signed-out UI on reload | reading auth store before hydration | gate on `useHydrated()` |
| Logged out to `/login?subscription=inactive` | entitlement is `blocked` tier | that's `shouldBlockWorkspaceAccess`; `read_only` is NOT blocked |
| Permission check always false | hardcoded string ≠ backend catalog | use `PERMISSIONS.*`, keep it in sync with the BE constants |
| Costs/COGS columns hidden | `costs.view` not granted | expected — gate is `useHasPermission(PERMISSIONS.costsView)` |

---

## 7. Things NOT to do

- Don't treat an FE permission/feature check as security — the backend is the gate.
- Don't hardcode permission strings — use `PERMISSIONS` (`hooks/use-has-permission.ts`).
- Don't read auth/feature state without `useHydrated()` before any redirect/branch.
- Don't let `classifyEntitlementAccess` drift from the backend `entitlementAccess`.
- Don't re-derive permission category colors / action icons — reuse `components/shared/permissions`.
- Don't block `read_only` (past-due) orgs — only `blocked`.
