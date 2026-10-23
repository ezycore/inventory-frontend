// coding-standard: maintained
import { RouteAccessGuard } from "@/components/shared/route-access-guard";

/**
 * Feature gate for the Inbox section (`/inbox`, `/inbox/settings`).
 *
 * The sidebar already hides the row without the `inbox` feature or `inbox.view`; this keeps
 * the URL honest too, reading the same requirement out of `constants/navItem.ts`. The backend
 * still refuses connecting and replying on its own (`requireFeatureForWrites("inbox")`).
 */
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <RouteAccessGuard>{children}</RouteAccessGuard>;
}
