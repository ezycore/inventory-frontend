"use client";
// coding-standard: maintained

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Loader2, Palette } from "lucide-react";
import type { ReadyMadeTheme } from "@/lib/storefront-themes";
import { getErrorMessage, isApiError } from "@/lib/error-handling";
import { useStartHomeFromTheme, useStoreHomePageRow } from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { OptionCard } from "@/ui/components/option-card";

type Choice = "look" | "home";

/**
 * Themes → Apply, for a theme that carries a home page of its own
 * (`homeLayout`): the look alone — what applying a theme has always done — or
 * the look AND the home page started from the theme's layout.
 *
 * Either way the merchant lands in Customize with the theme staged, and nothing
 * reaches shoppers until they publish there. The home choice writes the
 * theme's layout into the home page's DRAFT first (`useStartHomeFromTheme`);
 * Customize's publish bar then publishes or discards the two together
 * (`SitePublishBar`), and the live home stays in the page's history.
 *
 * ⚠ **Never over the merchant's own unpublished home edits.** A draft is not
 * in the revision history, so replacing one would lose work for good. Such a
 * draft is named here and Continue waits for it to be published or discarded;
 * the backend refuses it too (`STOREFRONT_HOME_HAS_DRAFT`). A draft a theme
 * wrote (`draftTheme`) may be replaced — that is changing one's mind.
 */
export function ApplyThemeDialog({
  theme,
  open,
  onOpenChange,
  landingIsHomepage = false,
}: {
  theme: ReadyMadeTheme;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The store's address shows a landing page, so its own home page is not what shoppers see there. */
  landingIsHomepage?: boolean;
}) {
  const router = useRouter();
  const start = useStartHomeFromTheme();
  const { home } = useStoreHomePageRow();
  const [choice, setChoice] = useState<Choice>("look");
  const [problem, setProblem] = useState<string | null>(null);

  // Unpublished home edits that are the MERCHANT's, not a theme's.
  const ownDraft = !!home?.hasDraft && !home.draftTheme;
  const blocked = choice === "home" && ownDraft;
  const customizeUrl = `/ecommerce/customize?theme=${theme.id}`;

  const confirm = () => {
    setProblem(null);
    if (choice === "look") {
      router.push(customizeUrl);
      return;
    }
    start.mutate(theme.id, {
      onSuccess: () => router.push(customizeUrl),
      onError: (error) =>
        setProblem(
          isApiError(error) && error.code === "STOREFRONT_HOME_HAS_DRAFT"
            ? "Your home page has changes you haven't published. Publish or discard them first."
            : getErrorMessage(error),
        ),
    });
  };

  return (
    // Held open while the home page is being written, so the merchant is not
    // left wondering whether it was.
    <Dialog open={open} onOpenChange={(next) => !start.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply “{theme.label}”?</DialogTitle>
          <DialogDescription>
            You&apos;ll see it in Customize first. Nothing changes for shoppers until you publish.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2" role="group" aria-label="What to change">
          <OptionCard
            selected={choice === "look"}
            onSelect={() => setChoice("look")}
            icon={Palette}
            label="Change the look only"
            badge={
              <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
                Recommended
              </span>
            }
            description="Colours, fonts, header, footer and product cards. Your home page, photos, words and menus stay as they are."
          />
          <OptionCard
            selected={choice === "home"}
            onSelect={() => setChoice("home")}
            icon={LayoutTemplate}
            label="Change the look and start the home page from this theme"
            tone={ownDraft ? "warn" : "muted"}
            description={
              ownDraft
                ? "Your home page has changes you haven't published. Publish or discard them first."
                : "Your home page becomes this theme's layout, with sample photos and words for you to edit. Your current home page stays in its history and can be restored."
            }
          />
        </div>

        {choice === "home" && landingIsHomepage ? (
          <p className="text-xs text-muted-foreground">
            Your store&apos;s address shows a landing page, so shoppers will see this home page only
            once you switch back to it in Pages.
          </p>
        ) : null}
        {blocked && home ? (
          <p className="text-xs">
            <Link href={`/ecommerce/pages/${home._id}`} className="font-medium text-primary underline-offset-4 hover:underline">
              Open your home page
            </Link>
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="text-xs text-destructive">
            {problem}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={start.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={blocked || start.isPending} onClick={confirm}>
            {start.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Preview in Customize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
