"use client";
// coding-standard: maintained

import Link from "next/link";
import { useGetStorefrontSettings } from "@/services/api";

/**
 * Says so when shoppers do not see this home: the store's `/` is a landing page
 * the merchant chose on Pages. The sections below still save and come back when
 * that page stops being the homepage — without this note the merchant would edit
 * a page nobody sees, in a preview that still shows it.
 */
export function LandingHomeNotice() {
  const { data: settings } = useGetStorefrontSettings();
  if (!settings?.homePageId) return null;

  return (
    <p className="rounded-md border bg-muted/50 p-3 text-xs leading-snug text-muted-foreground">
      Your homepage is a landing page, so shoppers don&apos;t see these sections. They come back when
      you stop using that page as your homepage in{" "}
      <Link href="/ecommerce/pages" className="font-medium text-primary hover:underline">
        Pages
      </Link>
      .
    </p>
  );
}
