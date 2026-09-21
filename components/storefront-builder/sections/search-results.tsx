// coding-standard: maintained
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { SearchPageView } from "@/components/storefront/search/search-page";

/**
 * The search page's results — the core section of a search page on the builder.
 * No settings: the page is whatever the shopper typed, and the merchant's own
 * sections sit above and below it (a popular-categories row under an empty
 * result is the reason this page is worth having sections at all).
 */
export function SearchResultsSection(_props: SectionViewProps<Record<string, never>>) {
  return (
    <div className="sfb-core">
      <SearchPageView />
    </div>
  );
}
