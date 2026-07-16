import { redirect } from "next/navigation";

/**
 * Navigation moved into Customize (Theme | Templates | Navigation) so header,
 * footer and announcement edits get the live preview. Kept as a redirect for
 * bookmarks and any links that still point here.
 */
export default function NavigationPage() {
  redirect("/ecommerce/customize?section=navigation");
}
