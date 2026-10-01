// coding-standard: maintained
import { storePageMetadata } from "@/lib/storefront-metadata";
import { SystemPage } from "@/components/storefront-builder/system-page";

export async function generateMetadata() {
  return storePageMetadata({ title: "My account", index: false });
}

/** The account area. Whether it exists at all is the layout's business (§6 page controls). */
export default function Page() {
  return (
    <SystemPage path="/account" />
  );
}
