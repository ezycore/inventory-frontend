import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "Verify email", index: false });
}

export default function Page() {
  return <View />;
}
