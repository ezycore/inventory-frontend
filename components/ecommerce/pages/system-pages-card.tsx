"use client";
// coding-standard: maintained

import Link from "next/link";
import { PencilRuler } from "lucide-react";
import { useGetStorefrontSettings, useStorefrontPages, useUpdateStorefrontSettings } from "@/services/api";
import type { StorefrontSettings, UpdateStorefrontSettingsDto } from "@/types";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";

/** What each system page is, in the merchant's words. Keyed by `systemKey`. */
const BLURB: Record<string, string> = {
  cart: "What shoppers see when they open the full cart page.",
  checkout: "Where shoppers enter their details and place the order.",
  search: "What a shopper's search finds.",
  account: "Sign-in, and a shopper's own order history.",
  collection: "A category's products.",
  product: "One product's page.",
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
 * The home page is deliberately absent — it has its own card above.
 */
export function SystemPagesCard() {
  const { data } = useStorefrontPages({ kind: "system", limit: 20 });
  const { data: settings } = useGetStorefrontSettings();
  const update = useUpdateStorefrontSettings();
  const pages = (data?.items ?? []).filter((page) => page.systemKey && page.systemKey !== "home");
  if (pages.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Shop pages ({pages.length})</p>
        <p className="text-xs text-muted-foreground">
          Your shop&apos;s built-in pages. Add sections above and below what each one already shows,
          or switch off the ones your shop does not need.
        </p>
      </div>
      <ul className="divide-y">
        {pages.map((page) => {
          const control = SWITCHES[page.systemKey as string];
          const on = settings && control ? control.read(settings) : true;
          return (
            <li key={page._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{page.title}</p>
                <p className="text-xs text-muted-foreground">
                  {control && !on ? control.off : (BLURB[page.systemKey as string] ?? "A built-in page of your shop.")}
                  {page.hasDraft ? " It has unpublished changes." : null}
                </p>
              </div>
              {control ? (
                <Switch
                  checked={on}
                  // One switch saves on its own, like the page settings do: this
                  // is an operational choice about the live shop, not a draft to
                  // publish later, and a Save bar on a card of four rows would
                  // ask the merchant to confirm a decision they already made.
                  disabled={!settings || update.isPending}
                  onCheckedChange={(next) => update.mutate(control.write(next))}
                  aria-label={`Show the ${page.title.toLowerCase()} page`}
                />
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href={`/ecommerce/pages/${page._id}`}>
                  <PencilRuler className="mr-1.5 h-4 w-4" />
                  Open editor
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
