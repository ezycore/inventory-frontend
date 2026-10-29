// coding-standard: maintained
import { storePageMetadata } from "@/lib/storefront-metadata";
import View from "./view";

export async function generateMetadata() {
  return storePageMetadata({ title: "Unsubscribe", index: false });
}

/** Where a marketing email's footer link lands (backend docs/plan/notifications.md §3.5b). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await searchParams;
  return <View token={typeof token === "string" ? token : null} />;
}
