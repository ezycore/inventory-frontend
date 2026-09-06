"use client";
// coding-standard: maintained

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { lookProgress } from "@/lib/storefront-look-progress";
import { recommendedThemeFor } from "@/lib/storefront-themes";
import { Button } from "@/ui/components/button";
import { cn } from "@/ui/lib/utils";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The three things that decide whether a shop looks like itself, at the top of
 * the Look panel.
 *
 * **Why these three.** Across all 43 storefronts, two had applied a ready-made
 * theme, two had a logo and five had touched any design axis. Those are not
 * preferences — there are no live merchants yet, so the numbers describe what
 * the product produces when nobody makes an effort: a shop on default colours,
 * default type and no mark, identical to every other EzyCore shop. Sixteen
 * panels of controls are worth nothing at that reach, so the fix is not another
 * control; it is naming the first three moves in the one place a merchant who
 * came to change their look will be standing.
 *
 * **It disappears when it is done**, rather than settling into a row of ticks.
 * A permanent checklist is furniture, and the state it reports is visible in
 * the blocks directly underneath anyway.
 */
export function StartHere({
  draft,
  hasLogo,
}: {
  draft: CustomizeDraft;
  /** The store's own logo, or the organization's — either counts as a mark. */
  hasLogo: boolean;
}) {
  const industry = useAuthStore((s) => s.user?.organization?.industry);
  const recommended = recommendedThemeFor(industry);
  const progress = lookProgress({
    appliedThemeId: draft.appliedThemeId,
    surface: draft.design.surface,
    hasLogo,
  });

  if (progress.done) return null;

  const steps = [
    {
      key: "theme",
      done: progress.theme,
      label: recommended
        ? `Start from ${recommended.label}`
        : "Start from a ready-made theme",
      // Naming the trade is the whole point of the recommendation: it says the
      // suggestion was made for this shop rather than picked off a shelf.
      hint: recommended
        ? `Built for ${recommended.bestFor.toLowerCase()}.`
        : "Five looks, each a whole shop rather than a colour swap.",
    },
    {
      key: "logo",
      done: progress.logo,
      label: "Add your logo",
      hint: "The one thing on the page that can only be yours.",
    },
    {
      key: "palette",
      done: progress.palette,
      label: "Pick a palette",
      hint: "Below — the paper your shop is printed on.",
    },
  ];

  return (
    // A dashed callout INSIDE the block flow rather than a band across it:
    // `PartGroup` already gives every direct child its own padding and hairline,
    // and a second border on top of that reads as a rendering fault.
    <div className="rounded-lg border border-dashed bg-background p-3">
      <p className="text-xs font-semibold">Start here</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        Three moves take a shop from “an EzyCore store” to yours.
      </p>

      <ol className="mt-2.5 space-y-2">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-2">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full border text-[10px]",
                step.done
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-dashed text-transparent",
              )}
            >
              <Check className="h-2.5 w-2.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-xs font-medium",
                  step.done && "text-muted-foreground line-through",
                )}
              >
                {step.label}
              </span>
              {step.done ? null : (
                <span className="block text-[11px] leading-snug text-muted-foreground">
                  {step.hint}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {/* Only the theme step leads anywhere: the other two are controls in this
          same panel, three inches down, and a button that scrolls the reader to
          something already in front of them is noise. */}
      {draft.appliedThemeId ? null : (
        <Button asChild size="sm" variant="outline" className="mt-2.5 h-7 text-xs">
          {/* Deep-links the recommendation straight into this editor as an
              unsaved edit — `?theme=` is the whole apply flow, so the merchant
              sees it applied, keeps Discard, and never leaves the page they are
              already working on. Without a recommendation there is nothing to
              stage, so it goes to the store instead. */}
          <Link
            href={
              recommended
                ? `/ecommerce/customize?part=look&theme=${recommended.id}`
                : "/ecommerce/themes"
            }
          >
            {recommended ? `Apply ${recommended.label}` : "Browse themes"}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
  );
}
