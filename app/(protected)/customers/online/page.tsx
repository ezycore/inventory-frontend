import { redirect } from "next/navigation";

/**
 * `/customers/online` has no list of its own — online accounts are a tab on the
 * merged Customers page (docs/plan/onboarding-workspace.md §6.2). Only the
 * detail route `/customers/online/[id]` lives under this segment, which left the
 * parent 404ing for anyone who trimmed the URL or reached for it by habit after
 * the old `/ecommerce/customers` page was removed.
 */
export default function OnlineCustomersPage() {
  redirect("/customers?tab=accounts");
}
