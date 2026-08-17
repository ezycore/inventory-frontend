import { RouteAccessGuard } from "@/components/shared/route-access-guard";

/**
 * One gate for all twelve report screens.
 *
 * Each page renders its own report component and none of them checked
 * permissions, so a `staff` user opening `/reports/sales` got a 403 from the API
 * and **"No data available"** on screen — indistinguishable from a shop that had
 * sold nothing. The guard reads the required permission out of `navItem.ts`, so
 * `/reports/expiry` (gated on `stock.view`, because it is a shop-floor screen)
 * stays open to the counter person while the financial reports do not.
 */
export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteAccessGuard>{children}</RouteAccessGuard>;
}
