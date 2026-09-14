// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { SectionTitle } from "@/components/storefront/sf-bits";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["product-grid"]["settings"];

/**
 * A grid of products from one source. The heading and the grid box are server
 * markup; the cards are the storefront's own `ProductCard`s, loaded as an island
 * because they carry the cart and quick-buy.
 *
 * `columns` overrides the store's responsive `--cols` ramp only when the
 * merchant set it (`.sfb-cols` in `app/(storefront)/storefront-builder.css`).
 */
export function ProductGridSection({ settings, context, data }: SectionViewProps<Spec>) {
  const products = data?.items ?? [];
  if (products.length === 0) return null;
  return (
    <div
      className={settings.columns ? "sfb-cols" : undefined}
      style={responsiveVars("sfb-cols", settings.columns)}
    >
      {settings.heading ? <SectionTitle>{settings.heading}</SectionTitle> : null}
      <Island name="product-cards" props={{ products, currency: context.currency }} />
    </div>
  );
}
