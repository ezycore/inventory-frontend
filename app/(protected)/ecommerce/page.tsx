import { redirect } from "next/navigation";

// Store Overview was removed (G11, decision D5 in the backend's business-modes.md): its store
// status and live-product / cart counts are the dashboard's "Your store" card, and the full cart
// numbers are on Abandoned Carts.
export default function EcommerceIndexPage() {
  redirect("/dashboard");
}
