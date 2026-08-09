---
name: rbac-auth
description: 'RBAC, feature gates and session handling on the FRONTEND — permission-based UI gating, the auth store, feature-flag helpers, subscription/billing enforcement, and the merchant role builder. USE WHEN: hiding/showing UI by permission (`useHasPermission`, `costs.view`, `users.manage`, `roles.manage`), gating a module by plan feature (`isFeatureEnabled`), a page that should force-logout or show an overdue banner, "button visible but 403 on click" / "nav item missing" / "logged out unexpectedly" / "workspace blocked", building or editing a custom role, the permission picker / catalog, deleting a role and reassigning its holders, or reading `user.permissions` / `user.organization.features`. Touches `inventory-frontend/{services/stores/use-auth-store.ts,hooks/use-has-permission.ts,lib/feature-utils.ts,lib/subscription-utils.ts,components/shared/permissions,components/settings/roles,app/(protected)/settings/roles,app/(protected)/layout.tsx,components/profile/permissions-tab.tsx,services/api/modules/{roles,users}}`. The BACKEND owns the real gates (authenticate → checkPermission → requireFeature, org scoping) — read `inventory-backend/.claude/skills/rbac-auth/SKILL.md`; this file does not duplicate it.'
---

# RBAC & Auth Skill (Frontend)

The frontend gates are **UI affordances only** — they hide what a user can't do so the app reads
correctly. The real enforcement is server-side. Never treat an FE permission check as security.

> **The three server gates (authenticate → permission → feature), roles, and org/location scoping**
> live in [`inventory-backend/.claude/skills/rbac-auth/SKILL.md`](../../../../inventory-backend/.claude/skills/rbac-auth/SKILL.md).
> If a button is hidden here but the endpoint is still reachable, that is by design — the backend is the
> gate. If a user *has* the permission but gets 403, the bug is on the backend side.

---

## 1. Permission gating

- **`useHasPermission(permission)`** ([`hooks/use-has-permission.ts`](../../../hooks/use-has-permission.ts))
  reads `user.permissions` from the auth store and returns a boolean. The `PERMISSIONS` const there
  mirrors the backend catalog (`inventory-backend/src/constants/permissions.ts`, **85** strings).
  The five declared today: `costs.view` (COGS/unit-cost figures), `stock.manage`, `users.manage`
  (user admin), `roles.view` / `roles.manage` (reading vs authoring roles — see §5), and
  `organization.edit`. **Never hardcode a permission string** in a component — add it to
  `PERMISSIONS`.
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
- `isVatActive(org)` — every VAT surface. **No area argument**: VAT registration belongs to the
  organization, so sales and purchases share one answer. Replaced `isTaxActive(org, area)`.
  `claimsInputRebate(org)` is the separate "may it reclaim input VAT?" question — see the
  [`vat`](../vat/SKILL.md) skill.
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
[`services/api/modules/users`](../../../services/api/modules/users) back Settings → Roles and user
admin. Since 2026-08-09 the roles page is a **full CRUD surface**, not a read-only list — merchants
author their own roles alongside the built-in and platform ones.

**Permissions differ per action** and the split is deliberate: `roles.view` reads,
`roles.manage` writes, `users.manage` places people in roles. `manager` holds the first and third,
not the second.

Four things the UI has to get right, each with a reason in the backend:

- **Only `source: "custom"` rows are editable.** `system` is defined in backend code; `mc` is owned
  by Mission Control and the next push overwrites local edits. The table shows edit/delete only for
  `custom`.
- **The permission picker renders `GET /roles/catalog`, not `ALL_PERMISSIONS`.** The catalog is
  filtered by the org's plan and marks unavailable modules `available: false` — render those
  disabled with a reason rather than hiding them, or a merchant reads a missing module as a bug.
  `grantable` is the set a role may actually be composed from.
- **A permission the role already holds stays checked even when off-plan.** The backend grandfathers
  it (so a downgraded org can still rename the role); disabling that checkbox would strand the
  merchant with no way to remove it.
- **Delete requires reassignment.** Deleting a role someone holds is a *lockout*, not a downgrade —
  the backend refuses with `ROLE_IN_USE`. Read `GET /roles/:slug/usage` first and make the merchant
  pick a target; surface the API error verbatim, because `REASSIGN_WOULD_STRAND_USERS` names a case
  the dialog cannot pre-empt.

A role edit takes effect on the holder's **next request** — permissions resolve per request
server-side, with no re-login. That is why the `role.changed` invalidation event dirties `profile`
as well as `roles` and `users`: miss it and the nav keeps offering pages that now 403.

Use the shared permissions components (§1) to render the matrix — never re-list permission strings
by hand.

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
| Roles page loads but "New role" is missing | has `roles.view`, not `roles.manage` | expected — reading and authoring are separate grants |
| Edit/delete missing on a role row | it is `system` or `mc` | expected — only `source: "custom"` is editable here |
| A permission is absent from the builder | the org's plan excludes that module | expected — it renders disabled, not hidden; check `available` on the catalog module |
| Delete says the role is in use after you moved everyone | the count is read live from `/usage` | refetch; someone was assigned between the read and the delete |

---

## 7. Things NOT to do

- Don't treat an FE permission/feature check as security — the backend is the gate.
- Don't hardcode permission strings — use `PERMISSIONS` (`hooks/use-has-permission.ts`).
- Don't read auth/feature state without `useHydrated()` before any redirect/branch.
- Don't let `classifyEntitlementAccess` drift from the backend `entitlementAccess`.
- Don't re-derive permission category colors / action icons — reuse `components/shared/permissions`.
- Don't block `read_only` (past-due) orgs — only `blocked`.
