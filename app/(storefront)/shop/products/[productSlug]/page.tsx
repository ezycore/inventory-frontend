import { getStoreContext } from "@/lib/storefront-host";
import { getStoreProduct } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const { slug } = await getStoreContext();
  const product = slug ? await getStoreProduct(slug, productSlug) : null;
  return storePageMetadata({
    // Merchant SEO overrides win; else the (online) title / description.
    title: product?.seo?.title || product?.name || "Product",
    description:
      product?.seo?.description ||
      product?.description?.slice(0, 200) ||
      undefined,
    path: `/products/${productSlug}`,
    image: product?.images?.[0]?.url || product?.images?.[0]?.mediumUrl,
  });
}

export default function Page() {
  return <View />;
}
