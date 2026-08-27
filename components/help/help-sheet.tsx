// coding-standard: maintained
"use client";

import { ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DEFAULT_LOCALE } from "@/i18n/config";
import {
  findHelpForPath,
  getHelpPage,
  helpPagesFor,
  isHelpLocale,
  type HelpLocale,
  type HelpPage,
} from "@/lib/help/resolve";
import { Button } from "@ui/components/button";
import { ScrollArea } from "@ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ui/components/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/tooltip";
import { HelpMarkdown } from "./help-markdown";
import { HelpVideo } from "./help-video";

/**
 * The "?" in the header. Opens help **for the screen you are on**, not a table of contents.
 *
 * That default is the whole point: the person reaching for this is mid-task, often with a customer
 * in front of them, and making them find their own screen in an index is most of the way to not
 * helping at all. When nothing documents the current screen we fall back to the index rather than
 * showing an error — an unwritten page is a gap in our coverage, not the user's mistake.
 */
export function HelpSheet() {
  const pathname = usePathname();
  const t = useTranslations("layout.help");
  const rawLocale = useLocale();
  const locale: HelpLocale = isHelpLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  // Re-aim at the current screen on each open, so it never reopens on last week's page. Done here
  // rather than in an effect: opening is the event that should choose the topic, and resolving on
  // open also means navigating underneath an open drawer can't swap the article mid-read.
  const handleOpenChange = (next: boolean) => {
    if (next) setSlug(findHelpForPath(pathname, locale)?.slug ?? null);
    setOpen(next);
  };

  const page = slug ? getHelpPage(slug, locale) : undefined;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("title")}>
              <HelpCircle className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("tooltip")}</TooltipContent>
      </Tooltip>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4">
          {page ? (
            <>
              <button
                type="button"
                onClick={() => setSlug(null)}
                className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("allTopics")}
              </button>
              <SheetTitle className="text-left text-lg">{page.title}</SheetTitle>
              <SheetDescription className="text-left">{page.summary}</SheetDescription>
            </>
          ) : (
            <>
              <SheetTitle className="flex items-center gap-2 text-left text-lg">
                <BookOpen className="h-5 w-5" />
                {t("title")}
              </SheetTitle>
              <SheetDescription className="text-left">{t("subtitle")}</SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* min-h-0: without it the flex item's default `min-height: auto` grows to fit the article,
            so the scroll viewport is never bounded and long guides just get clipped. */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-4">
            {page ? (
              <>
                <HelpVideo src={page.videoUrl} />
                <HelpMarkdown source={page.body} onNavigate={setSlug} />
              </>
            ) : (
              <HelpIndex pages={helpPagesFor(locale)} onSelect={setSlug} />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function HelpIndex({
  pages,
  onSelect,
}: {
  pages: HelpPage[];
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {pages.map((page) => (
        <button
          key={page.slug}
          type="button"
          onClick={() => onSelect(page.slug)}
          className="rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-accent"
        >
          <div className="text-sm font-medium">{page.title}</div>
          <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{page.summary}</div>
        </button>
      ))}
    </div>
  );
}
