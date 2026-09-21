"use client";
// coding-standard: maintained

import Link from "next/link";
import { ArrowRight, Palette } from "lucide-react";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { lookProgress } from "@/lib/storefront-look-progress";
import { recommendedThemeFor } from "@/lib/storefront-themes";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { useLiveStoreSettings } from "@/components/ecommerce/use-live-store-settings";

/**
 * Store Overview → the one prompt to give the shop a look of its own.
 *
 * **Why it is here and not only in Customize.** The evidence that a new shop
 * launches on default everything is also the evidence that the panel holding
 * the fix does not get opened: Design and Brand sat at 12% adoption while the
 * parts named after something a merchant can see on their own site sat at
 * 51-67%. Putting the same three steps behind one more click into the panel
 * nobody opens would repeat the failure one level down, so the prompt goes where
 * a merchant with a new store already is on day one.
 *
 * **It disappears the moment all three are done** — see `lookProgress`, which is
 * also what the Start here block reads, so the two can never disagree about
 * whether this shop still needs the nudge.
 *
 * It reports what is MISSING rather than listing steps with ticks: this card is
 * one row on a dashboard of numbers, and the full checklist is three inches
 * further on, at the top of the panel this links to.
 */
export function StoreLookCard() {
  // The live look, not the settings' copy: a store on the builder keeps its look
  // on the Site, and every new store is on the builder.
  const { data: settings, isLoading } = useLiveStoreSettings();
  const org = useAuthStore((s) => s.user?.organization);
  const progress = lookProgress({
    appliedThemeId: settings?.theme?.appliedThemeId,
    surface: settings?.theme?.design?.surface,
    // Either mark counts — the storefront falls back to the organization's when
    // the store has none, so a merchant with an org logo is not missing one.
    hasLogo: !!(settings?.logo || org?.logo),
  });

  // Nothing to say while the answer is unknown, and nothing to say once it is
  // done. Rendering a skeleton for a card that usually does not appear would
  // make the dashboard flicker a row on every load.
  if (isLoading || !settings || progress.done) return null;

  const recommended = recommendedThemeFor(org?.industry);
  const missing = [
    progress.theme ? null : "no theme",
    progress.logo ? null : "no logo",
    progress.palette ? null : "the default palette",
  ].filter(Boolean);

  return (
    <Card className="flex flex-col gap-3 border-dashed p-4 shadow-none sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-xl border bg-muted text-muted-foreground">
          <Palette className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Your store is wearing the default look
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {recommended
              ? `${listed(missing)} — ${recommended.label} is built for ${recommended.bestFor.toLowerCase()}.`
              : `${listed(missing)}. A few minutes here is what makes it look like your shop.`}
          </p>
        </div>
      </div>

      <Button asChild size="sm" variant="outline" className="flex-none">
        <Link href="/ecommerce/customize?part=look">
          Give it a look
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </Card>
  );
}

/** "no theme, no logo and the default palette" — a sentence, not a CSV. */
function listed(items: (string | null)[]): string {
  const parts = items.filter(Boolean) as string[];
  const head = parts.slice(0, -1).join(", ");
  const tail = parts[parts.length - 1];
  const list = head ? `${head} and ${tail}` : tail;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}`;
}
