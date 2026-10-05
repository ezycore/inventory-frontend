"use client";
// coding-standard: maintained

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useGetStorefrontSettings, useStorefrontPages, useUpdateStorefrontSettings } from "@/services/api";
import type { StorefrontSettings, UpdateStorefrontSettingsDto } from "@/types";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";

/** What each system page is, in the merchant's words. Keyed by `systemKey`. */
const BLURB: Record<string, string> = {
  cart: "What shoppers see when they open the full cart page.",
  checkout: "Where shoppers enter their details and place the order.",
  search: "What a shopper's search finds.",
  account: "Sign-in, and a shopper's own order history.",
  collection: "A category's products.",
  // The one fact to know before editing it: there is no per-product copy.
  product: "The page every product uses. A change here shows on all of them.",
};

/**
 * The three built-in pages a shop may switch off, and what going without each
 * one costs. Every other system page is the shop itself and has no switch.
 *
 * These lived in Store settings → General until 2026-09-22, in a card called
 * "Shopper pages" three screens away from the pages they govern. They are page
 * controls in every sense — one page each, no effect on anything else — so they
 * belong beside the page (plan `pages-and-settings-consolidation.md` §2.2). The
 * storage did not move with them: `pagesConfig` and `customersConfig` are two
 * blocks for the reason recorded where they are written, and merging them would
 * be a migration on live stores for a tidier shape.
 */
const SWITCHES: Record<
  string,
  { off: string; read: (settings: StorefrontSettings) => boolean; write: (on: boolean) => UpdateStorefrontSettingsDto }
> = {
  search: {
    off: "Off hides the search box in your header as well as this page.",
    read: (settings) => settings.pagesConfig?.search !== false,
    write: (on) => ({ pagesConfig: { search: on } }),
  },
  cart: {
    off: "Off keeps the slide-out cart and sends /cart straight to checkout.",
    read: (settings) => settings.pagesConfig?.cartPage !== false,
    write: (on) => ({ pagesConfig: { cartPage: on } }),
  },
  account: {
    off: "Off means guest checkout only — shoppers still track orders from the link you send them.",
    read: (settings) => settings.customersConfig?.allowAccounts !== false,
    write: (on) => ({ customersConfig: { allowAccounts: on } }),
  },
};

/**
 * The shop's built-in pages — the cart, the checkout, search and the account
 * area.
 *
 * A card rather than a table: there are at most a handful, they are fixed, and
 * none of the table's columns says anything about them (they have no address of
 * their own, no ad attribution and no orders to count). Each can be edited — the
 * page's core section cannot be removed, and the page itself cannot be deleted —
 * and three of them can be switched off entirely, which is the one thing about
 * them a merchant decides.
 *
 * The home page is deliberately absent — it has its own card. On desktop this
 * card sits in the side column under it; on a phone it closes the list.
 */
export function SystemPagesCard() {
  const { data } = useStorefrontPages({ kind: "system", limit: 20 });
  const { data: settings } = useGetStorefrontSettings();
  const update = useUpdateStorefrontSettings();
  const pages = (data?.items ?? []).filter((page) => page.systemKey && page.systemKey !== "home");
  if (pages.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="px-4 pb-2.5 pt-3.5">
        <h2 className="text-base font-semibold lg:text-[15px]">Shop pages</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Built into every shop. Add sections around them, or turn off the ones you don&apos;t use.
        </p>
      </div>
      <ul className="divide-y border-t">
        {pages.map((page) => {
          const control = SWITCHES[page.systemKey as string];
          const on = settings && control ? control.read(settings) : true;
          return (
            <li key={page._id} className="flex items-center gap-2 py-2 pl-4 pr-1.5">
              <Link href={`/ecommerce/pages/${page._id}`} className="min-w-0 flex-1 py-1">
                <span className={cn("block text-[15px] font-semibold lg:text-sm", !on && "text-muted-foreground")}>
                  {page.title}
                </span>
                <span className="block text-[13px] text-muted-foreground lg:text-xs">
                  {control && !on ? control.off : (BLURB[page.systemKey as string] ?? "A built-in page of your shop.")}
                </span>
                {page.hasDraft ? (
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Unpublished changes
                  </span>
                ) : null}
              </Link>
              {control ? (
                // One switch saves on its own, like the page settings do: this
                // is an operational choice about the live shop, not a draft to
                // publish later, and a Save bar on a card of four rows would
                // ask the merchant to confirm a decision they already made.
                <span className="flex h-11 w-12 shrink-0 items-center justify-center">
                  <Switch
                    checked={on}
                    disabled={!settings || update.isPending}
                    onCheckedChange={(next) => update.mutate(control.write(next))}
                    aria-label={`Show the ${page.title.toLowerCase()} page`}
                  />
                </span>
              ) : null}
              <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-muted-foreground lg:h-9 lg:w-9">
                <Link href={`/ecommerce/pages/${page._id}`} aria-label={`Edit the ${page.title.toLowerCase()} page`}>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
