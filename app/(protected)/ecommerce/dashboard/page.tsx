import { redirect } from "next/navigation";

// Store Overview was removed (G11, D5): it repeated the dashboard's "Your store" card. Kept as a
// redirect so bookmarks and the storefront's "Back to admin" links still land somewhere.
export default function StoreOverviewRedirect() {
  redirect("/dashboard");
}
