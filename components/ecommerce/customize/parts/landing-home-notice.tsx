"use client";
// coding-standard: maintained

import Link from "next/link";
import { useGetStorefrontSettings, useStorefrontPages } from "@/services/api";

const NOTICE = "rounded-md border bg-muted/50 p-3 text-xs leading-snug text-muted-foreground";
const LINK = "font-medium text-primary hover:underline";

/**
 * Says so when shoppers do not see this home. Either the store's `/` is a
 * landing page the merchant chose on Pages — the sections below still save and
 * come back when that page stops being the homepage — or the home has moved onto
 * the builder, where it is edited as a page. Without this the merchant would edit
 * a page nobody sees, in a preview that still shows it.
 */
export function LandingHomeNotice() {
  const { data: settings } = useGetStorefrontSettings();
  const { data: systemPages } = useStorefrontPages({ kind: "system", limit: 10 });
  if (!settings) return null;

  if (settings.homePageId) {
    return (
      <p className={NOTICE}>
        Your homepage is a landing page, so shoppers don&apos;t see these sections. They come back when
        you stop using that page as your homepage in{" "}
        <Link href="/ecommerce/pages" className={LINK}>
          Pages
        </Link>
        .
      </p>
    );
  }

  const builderHome = systemPages?.items.find((page) => page.systemKey === "home");
  if (!builderHome) return null;
  return (
    <p className={NOTICE}>
      Your home page is built from sections now, so shoppers don&apos;t see these. Change it in the{" "}
      <Link href={`/ecommerce/pages/${builderHome._id}`} className={LINK}>
        page editor
      </Link>
      .
    </p>
  );
}
