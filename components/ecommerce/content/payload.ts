// coding-standard: maintained
import type { ContentPage, ContentPageInput } from "@/services/api";

/**
 * The wire shape of a storefront CMS page, both directions.
 *
 * These live here rather than inline in the page component so they can be
 * tested at the payload — which is the only place the bug they exist to prevent
 * is visible. The SEO pair was rendered by the form and carried by neither the
 * submit path nor the edit prefill: the page saved cleanly, the backend ignored
 * nothing (it accepts `seo` and always did), and the merchant's search title
 * simply never arrived. No error, no warning, nothing on screen to look at.
 */

/** Form values → the create/update body. */
export function cleanContentPage(data: Record<string, any>): ContentPageInput {
  return {
    title: String(data.title ?? "").trim(),
    slug: String(data.slug ?? "").trim(),
    body: data.body ?? "",
    published: !!data.published,
    showInFooter: !!data.showInFooter,
    sortOrder: Number(data.sortOrder) || 0,
    // Always sent, and always BOTH keys — even empty.
    //
    // Sending `""` rather than omitting is deliberate, and the only way to CLEAR
    // an override: `contentPageService.update` `$set`s the whole `seo`
    // subdocument, so an omitted key keeps its stored value and the merchant's
    // deletion silently does not take.
    seo: {
      title: String(data.seo?.title ?? "").trim(),
      description: String(data.seo?.description ?? "").trim(),
    },
  };
}

/** A stored page → the edit form's values. */
export function contentPageToForm(p: ContentPage): Record<string, unknown> {
  return {
    title: p.title,
    slug: p.slug,
    body: p.body ?? "",
    published: !!p.published,
    showInFooter: !!p.showInFooter,
    sortOrder: p.sortOrder ?? 0,
    // `form.reset()` takes this object as the WHOLE form state, so a key missing
    // here is not "left alone" — it resets to undefined and the input renders
    // blank. With the submit path always sending both keys, omitting them here
    // would turn every edit of an unrelated field into a wipe of the merchant's
    // SEO overrides.
    seo: {
      title: p.seo?.title ?? "",
      description: p.seo?.description ?? "",
    },
  };
}
