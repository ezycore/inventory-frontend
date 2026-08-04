import { redirect } from "next/navigation";

/**
 * Navigation moved into Customize, where the header, footer and announcement
 * bar are edited beside the live preview — each with the rest of its own part
 * of the store rather than in a tab of its own. Kept as a redirect for
 * bookmarks and any links that still point here.
 */
export default function NavigationPage() {
  redirect("/ecommerce/customize?part=header");
}
