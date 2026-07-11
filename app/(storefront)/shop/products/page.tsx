import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "All products", path: "/products" });
}

export default function Page() {
  return <View />;
}
