import { getStoreContext } from "@/lib/storefront-host";
import { getStorePage } from "@/lib/storefront-server";
import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageSlug: string }>;
}) {
  const { pageSlug } = await params;
  const { slug } = await getStoreContext();
  const page = slug ? await getStorePage(slug, pageSlug) : null;
  return storePageMetadata({
    title: page?.title || "Page",
    path: `/pages/${pageSlug}`,
  });
}

export default function Page() {
  return <View />;
}
