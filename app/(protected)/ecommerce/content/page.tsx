import { redirect } from "next/navigation";

/**
 * Content moved into Pages, where a store page is built from sections like every
 * other page of the shop and its text is edited in the same rich-text editor it
 * always had.
 *
 * This screen had already stopped being the place those pages live: a page moved
 * onto the builder was served from there, so editing it here changed nothing a
 * shopper could see, and the screen said so in a banner. What it still did was
 * CREATE — a page made here after a store's cutover became a legacy CMS document
 * that rendered on the shop but appeared nowhere in Pages, which is the confusion
 * this removes.
 *
 * Kept as a redirect rather than deleted: the help guides, support replies and
 * merchants' own bookmarks all point here.
 *
 * The CMS model itself is untouched. It is still the fallback the storefront
 * reads when no builder page owns a slug (`store-page-body.tsx`), and still the
 * rollback target for `moveContentPagesBack`. Retiring the SCREEN is not
 * retiring the data; that goes with the classic renderer, in the Storefront
 * Builder plan's own cleanup (§14.1).
 */
export default function ContentPage() {
  redirect("/ecommerce/pages");
}
