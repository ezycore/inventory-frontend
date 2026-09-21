// coding-standard: maintained
import type { StorefrontStore } from "@/lib/storefront-client";
import { canonicalTarget } from "@/lib/storefront-canonical";
import { storeJsonLd } from "@/lib/storefront-jsonld";
import { storeHref } from "@/lib/storefront-links";
import { JsonLd } from "@/components/storefront/json-ld";

/**
 * The store's Organization node — logo, contact details and social profiles, the
 * basis of a brand/knowledge-panel result. Emitted on the homepage only, one node
 * per site, whichever page draws it: the Customize home or a landing page used as
 * the homepage.
 *
 * Its `url` must agree with the home canonical, or the node claims a different
 * home page than the `<link rel="canonical">` on the same document. No origin, no
 * node — the same "say nothing rather than something false" rule the canonical follows.
 */
export function StoreHomeJsonLd({
  store,
  origin,
  base,
}: {
  store: StorefrontStore;
  origin: string;
  base: string;
}) {
  const home = canonicalTarget(store, { origin, base });
  if (!home.origin) return null;
  return <JsonLd data={storeJsonLd({ store, url: `${home.origin}${storeHref(home.base)}` })} />;
}
