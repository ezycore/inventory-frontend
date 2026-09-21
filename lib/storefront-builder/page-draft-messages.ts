// coding-standard: maintained
/**
 * The messages between the page editor and its preview frame.
 *
 * Their own module, with nothing else in it: the editor (admin bundle) and the
 * preview (`components/storefront-builder/page-draft-preview.tsx`, storefront
 * bundle) both need the names, and importing them from the preview component
 * would pull every section view into the admin's editor chunk.
 */

/** Editor → preview frame: the page's sections as they are now, saved or not. */
export const PAGE_DRAFT_MESSAGE = "ezycore-page-draft";
/** Preview frame → editor: mounted and listening, send the sections. */
export const PAGE_DRAFT_READY = "ezycore-page-draft-ready";
/** Preview frame → editor: the last sections sent are on screen. */
export const PAGE_DRAFT_APPLIED = "ezycore-page-draft-applied";
/** Preview frame → editor: the merchant clicked a section — `payload.id`. */
export const PAGE_SECTION_SELECT = "ezycore-page-section-select";
/** Editor → preview frame: the section being edited — `payload.id`, or `null` for none. */
export const PAGE_SECTION_FOCUS = "ezycore-page-section-focus";
