"use client";
// coding-standard: maintained

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { permissionsForPath } from "@/lib/nav-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * Render a screen only for someone allowed to open it, and say so plainly when
 * they are not.
 *
 * The permissions come from `constants/navItem.ts` — the same table the sidebar
 * filters on — so a route cannot be gated in the menu and left open on the page,
 * or vice versa. A route the table does not gate renders normally.
 *
 * **This is a courtesy, not a control.** The backend's `checkPermission` is what
 * actually protects the data; this exists so a `staff` user who reaches
 * `/reports/sales` is told *"you may not see this"* instead of being shown
 * **"No data available"**, which reads as *the shop made no sales* and is a
 * far worse lie than a 403.
 */
export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("common.access");
  const pathname = usePathname();
  const permissions = useAuthStore((s) => s.user?.permissions);

  const required = permissionsForPath(pathname);
  // Undefined = ungated route. An empty/absent permission list on the user side
  // means we do not know yet (first paint before `/auth/me` resolves), and
  // blanking the page on a maybe would flash a denial at everyone — so only an
  // explicit, loaded mismatch denies.
  const denied =
    !!required?.length &&
    Array.isArray(permissions) &&
    !required.some((p) => permissions.includes(p));

  if (!denied) return <>{children}</>;

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
