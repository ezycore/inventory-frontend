"use client";
// coding-standard: maintained

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import {
  featuresForPath,
  isReadOnlyRoute,
  permissionsForPath,
  unmetRouteFeatures,
} from "@/lib/nav-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { OrganizationFeatures } from "@/types";
import {
  FeatureLockedScreen,
  type FeatureLockReason,
} from "./feature-locked-screen";

/**
 * Render a screen only for someone allowed to open it, and say so plainly when
 * they are not.
 *
 * The permissions come from `constants/navItem.ts` — the same table the sidebar
 * filters on — so a route cannot be gated in the menu and left open on the page,
 * or vice versa. A route the table does not gate renders normally.
 *
 * **This is a courtesy, not a control.** The backend's `checkPermission` and
 * `requireFeature` are what actually protect the data; this exists so a `staff`
 * user who reaches `/reports/sales` is told *"you may not see this"* instead of
 * being shown **"No data available"**, which reads as *the shop made no sales*
 * and is a far worse lie than a 403.
 *
 * Two gates, in this order: **permission first, then feature.** Someone who may
 * not open a screen at all should never be shown an upsell for the capability
 * behind it — that offers a purchase which would not give them access, since
 * their role is what is stopping them.
 */
export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const permissions = useAuthStore((s) => s.user?.permissions);
  const features = useAuthStore((s) => s.user?.organization?.features);
  const planFeatures = useAuthStore((s) => s.user?.organization?.planFeatures);

  const required = permissionsForPath(pathname);
  // Undefined = ungated route. An empty/absent permission list on the user side
  // means we do not know yet (first paint before `/auth/me` resolves), and
  // blanking the page on a maybe would flash a denial at everyone — so only an
  // explicit, loaded mismatch denies.
  const denied =
    !!required?.length &&
    Array.isArray(permissions) &&
    !required.some((p) => permissions.includes(p));

  if (denied) return <PermissionDenied />;

  const lock = featureLock(pathname, features, planFeatures);
  if (lock) return <FeatureLockedScreen reason={lock} />;

  return <>{children}</>;
}

/**
 * Why this route's feature gate is closed, or `undefined` if it is open.
 *
 * The distinction is the point. `features` is the enforced map and says only
 * "no"; `planFeatures` is the ceiling, and the two together separate a
 * capability the merchant switched off — one click away, free — from one their
 * plan does not include, which costs money. Until `planFeatures` rode along on
 * `/me`, no screen outside Customize workspace could tell those apart, so the
 * only honest message either way was a generic error.
 *
 * Returns nothing until both maps have loaded: blanking a page on a maybe would
 * flash a lock at every merchant on first paint, which is the same reason the
 * permission check above waits for an explicit mismatch.
 */
function featureLock(
  pathname: string,
  features: OrganizationFeatures | undefined,
  planFeatures: OrganizationFeatures | undefined,
): FeatureLockReason | undefined {
  if (!features) return undefined;
  // A screen that only reads is never locked by a feature gate — the backend
  // serves it (`requireFeatureForWrites` lets GET through) precisely so a
  // downgrade cannot orphan the records made while the capability was on.
  // Locking it here would put that data out of reach with the API still
  // returning it, which is the failure the section guards were added to avoid,
  // arriving from the other side.
  //
  // Permissions still apply: they are checked before this runs, and a role that
  // may not read the screen still may not.
  if (isReadOnlyRoute(pathname)) return undefined;
  const missing = unmetRouteFeatures(featuresForPath(pathname), features);
  if (missing.length === 0) return undefined;

  // An unsatisfied any-of gate names every key that would open the screen; lead
  // with the one the merchant can act on most cheaply — a switch they own beats
  // a plan they have to buy.
  const switchedOff = missing.find((f) => planFeatures?.[f] === true);
  if (switchedOff) return { kind: "off", feature: switchedOff };
  return { kind: "plan", feature: missing[0] };
}

function PermissionDenied() {
  const t = useTranslations("common.access");
  return (
    <div className="flex items-center justify-center p-12">
      <div className="max-w-md rounded-lg border p-10 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">{t("restrictedTitle")}</h3>
        <p className="text-muted-foreground">{t("restrictedDescription")}</p>
      </div>
    </div>
  );
}
