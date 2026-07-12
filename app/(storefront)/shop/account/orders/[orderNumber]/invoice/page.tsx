// coding-standard: maintained
import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return storePageMetadata({ title: `Invoice ${orderNumber}`, index: false });
}

export default function Page() {
  return <View />;
}
