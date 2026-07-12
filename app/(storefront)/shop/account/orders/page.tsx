import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "Order history", index: false });
}

export default function Page() {
  return <View />;
}
