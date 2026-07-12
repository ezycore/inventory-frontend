"use client";
// coding-standard: maintained

import { Edit, Edit2Icon, GalleryHorizontalEnd, Image as ImageIcon, PlusCircleIcon } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/components/tooltip";

/**
 * Customize → Templates → "Home page" block: visual layout picker
 * (Classic / Hero Split / Minimal wireframes) + the hero-source control
 * (slides carousel vs static banner). Minimal has a typographic hero, so the
 * hero-source control collapses to an explanatory note there.
 */

const LAYOUTS: { id: string; label: string; desc: string }[] = [
  { id: "classic", label: "Classic", desc: "Hero card, category chips, product rails" },
  { id: "hero-split", label: "Hero Split", desc: "Split hero, trust row, promo tiles" },
  { id: "minimal", label: "Minimal", desc: "Centered manifesto, quiet product grid" },
];

/** Tiny wireframe sketch of each home layout (pure divs, no images). */
function LayoutSketch({ id }: { id: string }) {
  const img = "rounded-[3px] bg-primary/25";
  const line = "rounded-full bg-muted-foreground/40";
  if (id === "hero-split") {
    return (
      <div className="flex h-16 w-full flex-col gap-1 rounded-md border bg-muted/30 p-1.5">
        <div className="flex flex-1 gap-0 overflow-hidden rounded-[3px] border">
          <div className="flex flex-1 flex-col justify-center gap-1 p-1.5">
            <div className={cn(line, "h-1 w-3/4")} />
            <div className={cn(line, "h-1 w-1/2")} />
            <div className="h-1.5 w-6 rounded-[2px] bg-primary/50" />
          </div>
          <div className={cn(img, "w-2/5 rounded-none")} />
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2.5 flex-1 rounded-[2px] border bg-background" />
          ))}
        </div>
      </div>
    );
  }
  if (id === "minimal") {
    return (
      <div className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border bg-muted/30 p-1.5">
        <div className={cn(line, "h-0.5 w-6")} />
        <div className={cn(line, "h-1.5 w-3/5 bg-muted-foreground/60")} />
        <div className={cn(line, "h-1 w-2/5")} />
        <div className="mt-0.5 h-2 w-8 rounded-[2px] bg-muted-foreground/60" />
      </div>
    );
  }
  // classic
  return (
    <div className="flex h-16 w-full flex-col gap-1 rounded-md border bg-muted/30 p-1.5">
      <div className="flex flex-1 gap-1.5 rounded-[3px] border p-1.5">
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className={cn(line, "h-1 w-3/4")} />
          <div className="h-1.5 w-6 rounded-[2px] bg-primary/50" />
        </div>
        <div className={cn(img, "w-1/3")} />
      </div>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        ))}
        <div className="ml-auto flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2.5 w-3.5 rounded-[2px] border bg-background" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeTemplateBlock({
  layout,
  onLayoutChange,
  heroSource,
  onHeroSourceChange,
  slideCount,
  onEditSlides,
}: {
  layout: string;
  onLayoutChange: (v: string) => void;
  heroSource: string;
  onHeroSourceChange: (v: string) => void;
  slideCount: number;
  onEditSlides: () => void;
}) {
  const heroApplies = layout !== "minimal";
  const slidesActive = heroSource !== "banner";

  return (
    <Card className="space-y-3 p-5 shadow-none">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          Home page
        </h3>
        <p className="text-xs text-muted-foreground">
          Landing layout and hero section
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LAYOUTS.map((l) => {
          const active = layout === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onLayoutChange(l.id)}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors",
                active ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted/50",
              )}
            >
              <LayoutSketch id={l.id} />
              <span className="text-xs font-semibold">{l.label}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                {l.desc}
              </span>
            </button>
          );
        })}
      </div>

      {heroApplies && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Hero area shows
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => onHeroSourceChange("slides")}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                  slidesActive ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted/50",
                )}
              >
                <GalleryHorizontalEnd className="mt-0.5 h-4 w-4 flex-none text-primary" />
                <span>
                  <span className="block text-xs font-semibold">
                    Slides carousel
                  </span>
                  <span className={cn("mt-0.5 block text-[11px] leading-snug ", slideCount === 0 ? "text-amber-700" : "text-muted-foreground")}>
                    {slideCount === 0 ?
                      "No slides yet, add some"
                      :
                      "Rotating promos you manage in Theme"
                    }
                  </span>
                </span>
              </button>
              <button type="button" className="absolute right-2 top-2 rounded-full text-[10px] font-semibold text-muted-foreground cursor-pointer" onClick={onEditSlides}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {slideCount === 0 ?
                      <PlusCircleIcon className="inline h-4 w-4" />
                      :
                      <Edit className="inline h-4 w-4" />
                    }
                  </TooltipTrigger>
                  <TooltipContent side="top" className="w-max">
                    <p>
                      {slideCount === 0 ? "Add slides" : "Edit slides"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onHeroSourceChange("banner")}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                !slidesActive ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted/50",
              )}
            >
              <ImageIcon className="mt-0.5 h-4 w-4 flex-none text-primary" />
              <span>
                <span className="block text-xs font-semibold">Static banner</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  One banner image with the standard copy
                </span>
              </span>
            </button>
          </div>

          {!slidesActive && slideCount > 0 && <p className="text-[11px] text-muted-foreground">
            Your slides stay saved but hidden. The banner is also the preview
            image when your store link is shared.
          </p>}

        </div>
      )}
    </Card>
  );
}
