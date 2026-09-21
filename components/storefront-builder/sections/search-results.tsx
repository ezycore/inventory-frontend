// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { SearchPageView } from "@/components/storefront/search/search-page";

type Spec = (typeof SECTION_SPECS)["search-results"]["settings"];

/**
 * The search page's results — the core section of a search page on the builder.
 * The page itself is whatever the shopper typed, and the merchant's own sections
 * sit above and below it (a popular-categories row under an empty result is the
 * reason this page is worth having sections at all).
 *
 * Its only settings are the words for an EMPTY result, which is the one thing on
 * this page a merchant would write — and until 2026-09-21 the section had no
 * settings at all. Unset keeps the storefront's own wording in the shopper's
 * language, which is why they are not defaulted here.
 */
export function SearchResultsSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-core">
      <SearchPageView emptyHeading={settings.emptyHeading} emptyText={settings.emptyText} />
    </div>
  );
}
