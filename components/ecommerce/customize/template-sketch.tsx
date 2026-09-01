"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { cn } from "@/ui/lib/utils";

/**
 * Wireframe sketch for one template option — pure divs, no images, no store
 * data. Every option a merchant can pick has one, because the choices are
 * purely visual: nobody can infer "Sticky buy bar" or "Bold CTA" from the words.
 *
 * Sketches live in a flat record keyed `"<templateKey>:<value>"`, so adding an
 * option to `TEMPLATE_PARTS` without a sketch degrades to an empty frame rather
 * than throwing. Keep them abstract — they show *arrangement*, not content.
 */

const BAR = "block rounded-full bg-muted-foreground/35";
const IMG = "block rounded-[3px] bg-primary/20";
const CTA = "block rounded-[2px] bg-primary/60";
const BOX = "block rounded-[2px] border border-border bg-background";

function Frame({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        // `overflow-hidden` is a GUARD, not styling. These sketches are hand-sized
        // against a 64px frame, and one that mis-sizes itself used to paint over
        // the options above it rather than being clipped — a wireframe that
        // breaks the page it is describing. Clipping keeps that a small visual
        // bug in one tile instead of a broken panel.
        "flex h-16 w-full flex-col gap-1 overflow-hidden rounded-md border bg-muted/30 p-1.5",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Row of n product-card stand-ins — the shape most listing sketches share. */
function Cards({ n, tall }: { n: number; tall?: boolean }) {
  return (
    <span className="flex flex-1 gap-1">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn(BOX, "flex-1", tall && "h-full")} />
      ))}
    </span>
  );
}

/** Header bar stand-in, reused by the page-level sketches. */
function TopBar() {
  return (
    <span className="flex flex-none items-center gap-1 rounded-[2px] border border-border bg-background px-1 py-0.5">
      <span className={cn(BAR, "h-1 w-3")} />
      <span className="ml-auto flex gap-0.5">
        <span className={cn(BAR, "h-0.5 w-2")} />
        <span className={cn(BAR, "h-0.5 w-2")} />
      </span>
    </span>
  );
}

/**
 * Every option that has a wireframe, keyed `<templateKey>:<value>`.
 *
 * ⚠ **A missing key is not a missing decoration — it is an unusable control.**
 * The lookup falls back to a bare `<Frame />`, so an option with no entry renders
 * an empty box, and a panel where every option is an empty box gives a merchant
 * nothing to choose between. `template-sketch.test.ts` guards the gap and lists
 * the ones still outstanding.
 */
const SKETCHES: Record<string, ReactNode> = {
  /* ---------------------------------------------------------------- home */
  "home:classic": (
    <Frame>
      <span className="flex flex-1 gap-1.5 rounded-[3px] border border-border p-1.5">
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className={cn(BAR, "h-1 w-3/4")} />
          <span className={cn(CTA, "h-1.5 w-6")} />
        </span>
        <span className={cn(IMG, "w-1/3")} />
      </span>
      <span className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
        ))}
        <span className="ml-auto flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn(BOX, "h-2.5 w-3.5")} />
          ))}
        </span>
      </span>
    </Frame>
  ),
  "home:hero-split": (
    <Frame>
      <span className="flex flex-1 overflow-hidden rounded-[3px] border border-border">
        <span className="flex flex-1 flex-col justify-center gap-1 p-1.5">
          <span className={cn(BAR, "h-1 w-3/4")} />
          <span className={cn(BAR, "h-1 w-1/2")} />
          <span className={cn(CTA, "h-1.5 w-6")} />
        </span>
        <span className={cn(IMG, "w-2/5 rounded-none")} />
      </span>
      <Cards n={3} />
    </Frame>
  ),
  "home:minimal": (
    <Frame className="items-center justify-center">
      <span className={cn(BAR, "h-0.5 w-6")} />
      <span className={cn(BAR, "h-1.5 w-3/5 bg-muted-foreground/60")} />
      <span className={cn(BAR, "h-1 w-2/5")} />
      <span className={cn(BAR, "mt-0.5 h-2 w-8 rounded-[2px] bg-muted-foreground/60")} />
    </Frame>
  ),

  /* ---------------------------------------------------- collection page */
  "collection:grid-3": (
    <Frame>
      <span className={cn(BAR, "h-1 w-1/3")} />
      <Cards n={3} tall />
      <Cards n={3} tall />
    </Frame>
  ),
  "collection:grid-4": (
    <Frame>
      <span className={cn(BAR, "h-1 w-1/3")} />
      <Cards n={4} tall />
      <Cards n={4} tall />
    </Frame>
  ),
  "collection:sidebar": (
    <Frame>
      <span className="flex flex-1 gap-1">
        <span className="flex w-1/4 flex-col gap-1 rounded-[2px] border border-border bg-background p-1">
          <span className={cn(BAR, "h-0.5 w-full")} />
          <span className={cn(BAR, "h-0.5 w-3/4")} />
          <span className={cn(BAR, "h-0.5 w-full")} />
          <span className={cn(BAR, "h-0.5 w-2/3")} />
        </span>
        <span className="flex flex-1 flex-col gap-1">
          <Cards n={3} tall />
          <Cards n={3} tall />
        </span>
      </span>
    </Frame>
  ),

  /* ------------------------------------------------------ pagination */
  "pagination:pages": (
    <Frame>
      <Cards n={3} tall />
      <span className="flex flex-none items-center justify-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(BOX, "h-2.5 w-2.5", i === 0 && "border-primary bg-primary/60")}
          />
        ))}
      </span>
    </Frame>
  ),
  "pagination:infinite": (
    <Frame>
      <Cards n={3} tall />
      <span className="flex flex-none items-center justify-center gap-1 opacity-60">
        <Cards n={3} />
      </span>
    </Frame>
  ),
  "pagination:load-more": (
    <Frame>
      <Cards n={3} tall />
      <span className="flex flex-none items-center justify-center">
        <span className={cn(CTA, "h-2.5 w-10")} />
      </span>
    </Frame>
  ),

  /* --------------------------------------------------------- product page */
  "product:gallery-left": (
    <Frame>
      <span className="flex flex-1 gap-1.5">
        <span className={cn(IMG, "w-2/5")} />
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className={cn(BAR, "h-1 w-3/4")} />
          <span className={cn(BAR, "h-0.5 w-1/2")} />
          <span className={cn(CTA, "mt-0.5 h-2 w-8")} />
        </span>
      </span>
    </Frame>
  ),
  "product:gallery-top": (
    <Frame>
      <span className={cn(IMG, "h-6 w-full")} />
      <span className="flex flex-1 flex-col gap-1">
        <span className={cn(BAR, "h-1 w-3/4")} />
        <span className={cn(CTA, "h-2 w-8")} />
      </span>
    </Frame>
  ),
  "product:sticky-bar": (
    <Frame>
      <span className="flex flex-1 gap-1.5">
        <span className={cn(IMG, "w-2/5")} />
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className={cn(BAR, "h-1 w-3/4")} />
          <span className={cn(BAR, "h-0.5 w-1/2")} />
        </span>
      </span>
      <span className="flex flex-none items-center gap-1 rounded-[2px] border border-primary/40 bg-primary/10 px-1 py-0.5">
        <span className={cn(BAR, "h-0.5 w-4")} />
        <span className={cn(CTA, "ml-auto h-2 w-7")} />
      </span>
    </Frame>
  ),

  /* --------------------------------------------------------- product card */
  "productCard:standard": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-6 w-full")} />
      <span className={cn(BAR, "h-1 w-3/4")} />
      <span className={cn(BAR, "h-1 w-1/3")} />
      <span className={cn(CTA, "h-2 w-full")} />
    </Frame>
  ),
  "productCard:compact": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-8 w-full")} />
      <span className={cn(BAR, "h-0.5 w-2/3")} />
      <span className={cn(BAR, "h-0.5 w-1/3")} />
    </Frame>
  ),
  /* No card and no button — the photo carries it, with the name and price set
     centred beneath. Drawn without a CTA on purpose: that absence IS the option,
     and it is the only thing separating this from `compact` at a glance. */
  "productCard:editorial": (
    <Frame className="items-center p-2">
      <span className={cn(IMG, "h-9 w-full")} />
      <span className={cn(BAR, "h-1 w-1/2")} />
      <span className={cn(BAR, "h-1 w-1/4")} />
    </Frame>
  ),
  "productCard:bold": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-5 w-full")} />
      <span className={cn(BAR, "h-1 w-3/4 bg-muted-foreground/60")} />
      <span className={cn(CTA, "h-3 w-full")} />
    </Frame>
  ),

  /* -------------------------------------------------------- card buttons */
  "cardActions:add-buy": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-5 w-full")} />
      <span className={cn(BAR, "h-1 w-2/3")} />
      <span className="flex gap-1">
        <span className={cn(CTA, "h-2 flex-1")} />
        <span className={cn(BOX, "h-2 flex-1")} />
      </span>
    </Frame>
  ),
  "cardActions:add": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-6 w-full")} />
      <span className={cn(BAR, "h-1 w-2/3")} />
      <span className={cn(CTA, "h-2 w-full")} />
    </Frame>
  ),
  "cardActions:icons": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-6 w-full")} />
      <span className={cn(BAR, "h-1 w-2/3")} />
      <span className="flex justify-end gap-1">
        <span className={cn(BOX, "h-2.5 w-2.5")} />
        <span className={cn(CTA, "h-2.5 w-2.5")} />
      </span>
    </Frame>
  ),
  "cardActions:buy-first": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-5 w-full")} />
      <span className={cn(BAR, "h-1 w-2/3")} />
      <span className="flex gap-1">
        <span className={cn(BOX, "h-2 flex-1")} />
        <span className={cn(CTA, "h-2 flex-1")} />
      </span>
    </Frame>
  ),
  "cardActions:reveal": (
    <Frame className="p-2">
      <span className="relative flex h-9 w-full items-end justify-center">
        <span className={cn(IMG, "absolute inset-0")} />
        <span className={cn(CTA, "relative mb-1 h-2 w-4/5")} />
      </span>
      <span className={cn(BAR, "h-1 w-2/3")} />
    </Frame>
  ),
  "cardActions:icon-only": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-6 w-full")} />
      <span className="flex items-center gap-1">
        <span className={cn(BAR, "h-1 flex-1")} />
        <span className={cn(CTA, "h-2.5 w-2.5 rounded-full")} />
      </span>
    </Frame>
  ),

  /* -------------------------------------------------------------- image fit */
  "imageFit:fit": (
    <Frame className="items-center justify-center p-2">
      <span className="flex h-full w-full items-center justify-center rounded-[3px] border border-border bg-background p-1">
        <span className={cn(IMG, "h-4/5 w-3/5")} />
      </span>
    </Frame>
  ),
  "imageFit:crop": (
    <Frame className="p-2">
      <span className={cn(IMG, "h-full w-full")} />
    </Frame>
  ),

  /* --------------------------------------------------------- image ratio */
  /* Each sketch is drawn at its real aspect ratio, so the tile shows the shape
     it names rather than a label for it. */
  "imageRatio:square": (
    <Frame className="items-center justify-center p-2">
      <span className={cn(IMG, "aspect-square h-full")} />
    </Frame>
  ),
  "imageRatio:portrait": (
    <Frame className="items-center justify-center p-2">
      <span className={cn(IMG, "aspect-[3/4] h-full")} />
    </Frame>
  ),
  "imageRatio:landscape": (
    <Frame className="items-center justify-center p-2">
      {/* `h-full`, like its three siblings — NOT `w-full`. An aspect-ratio box
          sized by width takes the card's full ~230px and computes a ~172px
          height inside a 64px frame, so it escaped the tile and painted over the
          options above it. Height is the dimension the frame actually fixes,
          which is why every ratio sketch must be driven by it. */}
      <span className={cn(IMG, "aspect-[4/3] h-full")} />
    </Frame>
  ),
  "imageRatio:tall": (
    <Frame className="items-center justify-center p-2">
      <span className={cn(IMG, "aspect-[2/3] h-full")} />
    </Frame>
  ),

  /* ------------------------------------------------------- category tiles */
  "categoryTiles:tile": (
    <Frame className="items-center justify-center">
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span className={cn(IMG, "size-5")} />
            <span className={cn(BAR, "h-1 w-4")} />
          </span>
        ))}
      </span>
    </Frame>
  ),
  "categoryTiles:overlay": (
    <Frame className="items-center justify-center">
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(IMG, "flex h-7 w-5 items-end p-0.5")}>
            <span className={cn(BAR, "h-1 w-full bg-muted-foreground/60")} />
          </span>
        ))}
      </span>
    </Frame>
  ),
  /* Discs, not squares — the shape IS the option, since this is the one tile
     style that carries a letter instead of a photograph. */
  "categoryTiles:disc": (
    <Frame className="items-center justify-center">
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span className={cn(IMG, "size-5 rounded-full")} />
            <span className={cn(BAR, "h-1 w-4")} />
          </span>
        ))}
      </span>
    </Frame>
  ),

  "categoryTiles:circle": (
    <Frame className="items-center justify-center">
      <span className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span className={cn(IMG, "size-6 rounded-full")} />
            <span className={cn(BAR, "h-1 w-4")} />
          </span>
        ))}
      </span>
    </Frame>
  ),

  /* -------------------------------------------------------------- header */
  "header:classic": (
    <Frame className="justify-center">
      {/* Widths trimmed to FIT. The logo, three menu dashes and the icon pair
          together ran ~6px past the tile, and `ml-auto` pushed the overflow onto
          the icons — so with the frame now clipping, the option that is defined
          by having icons was the one drawn with them cut in half. */}
      <span className="flex items-center gap-1 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(BAR, "h-1.5 w-4 bg-muted-foreground/60")} />
        <span className="ml-1 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn(BAR, "h-1 w-2.5")} />
          ))}
        </span>
        <span className="ml-auto flex gap-1">
          <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
          <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
        </span>
      </span>
    </Frame>
  ),
  "header:minimal": (
    <Frame className="justify-center">
      <span className="flex items-center gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(BAR, "h-1.5 w-5 bg-muted-foreground/60")} />
        <span className="ml-auto flex gap-1">
          <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
          <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
        </span>
      </span>
    </Frame>
  ),
  "header:centered": (
    <Frame className="justify-center">
      <span className="flex flex-col items-center gap-1 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(BAR, "h-1.5 w-6 bg-muted-foreground/60")} />
        <span className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn(BAR, "h-1 w-3")} />
          ))}
        </span>
      </span>
    </Frame>
  ),
  /* The search field is the subject of both of these, so it is what the sketch
     draws at full width — a pill for one, a rule for the other. */
  "header:search-first": (
    <Frame className="justify-center">
      <span className="flex items-center gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(BAR, "h-1.5 w-4 bg-muted-foreground/60")} />
        <span className={cn(BOX, "h-2.5 flex-1 rounded-full")} />
        <span className={cn(CTA, "h-2.5 w-4 rounded-full")} />
      </span>
    </Frame>
  ),
  "header:boutique": (
    <Frame className="justify-center">
      <span className="flex flex-col gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        <span className="flex items-center gap-1.5">
          <span className={cn(BAR, "h-1.5 w-5 bg-muted-foreground/60")} />
          <span className="flex-1 border-b border-border pb-1" />
          <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
        </span>
        <span className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn(BAR, "h-1 w-3")} />
          ))}
        </span>
      </span>
    </Frame>
  ),
  /* The counterpart to `search-first`: the field is PLAIN, not a pill, and there
     is nothing else on the bar — no menu row, no icon cluster. Drawing the
     absences is what separates the two at a glance. */
  "header:clinical": (
    <Frame className="justify-center">
      <span className="flex items-center gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(BAR, "h-1.5 w-4 bg-muted-foreground/60")} />
        <span className={cn(BOX, "h-2.5 flex-1")} />
      </span>
    </Frame>
  ),

  /* -------------------------------------------------------------- footer
     All five sketch the same thing: a wide identity block on the LEFT and the
     link columns pushed to the RIGHT edge at their own width. That asymmetry is
     the point of the layout, so the sketches have to show it — a sketch of four
     equal columns is what the footer used to be, and looked fine while the real
     thing left half its width empty. */
  "footer:columns": (
    <Frame className="justify-end">
      <span className="flex items-start gap-2 rounded-[2px] border border-border bg-background p-1.5">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className={cn(IMG, "h-1.5 w-1.5 rounded-full")} />
          <span className={cn(BAR, "h-0.5 w-full")} />
          <span className={cn(BAR, "h-0.5 w-2/3")} />
        </span>
        {[0, 1].map((i) => (
          <span key={i} className="flex w-5 flex-col gap-0.5">
            <span className={cn(BAR, "h-0.5 w-3/5 bg-muted-foreground/60")} />
            <span className={cn(BAR, "h-0.5 w-full")} />
            <span className={cn(BAR, "h-0.5 w-4/5")} />
          </span>
        ))}
      </span>
    </Frame>
  ),
  "footer:simple": (
    <Frame className="justify-end">
      <span className="flex flex-col items-center gap-1 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(IMG, "h-1.5 w-1.5 rounded-full")} />
        <span className={cn(BAR, "h-0.5 w-2/3")} />
        <span className="flex items-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn(BAR, "h-0.5 w-2.5")} />
          ))}
        </span>
      </span>
    </Frame>
  ),
  "footer:rich": (
    <Frame className="justify-end gap-1">
      <span className="flex items-center justify-around rounded-[2px] border border-primary/40 bg-primary/10 px-1 py-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(CTA, "h-1.5 w-1.5 rounded-full")} />
        ))}
      </span>
      <span className="flex items-start gap-2 rounded-[2px] border border-border bg-background p-1.5">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className={cn(BAR, "h-0.5 w-full")} />
          <span className={cn(BAR, "h-0.5 w-2/3")} />
        </span>
        {[0, 1].map((i) => (
          <span key={i} className="flex w-5 flex-col gap-0.5">
            <span className={cn(BAR, "h-0.5 w-3/5 bg-muted-foreground/60")} />
            <span className={cn(BAR, "h-0.5 w-full")} />
          </span>
        ))}
      </span>
    </Frame>
  ),
  "footer:contact": (
    <Frame className="justify-end">
      <span className="flex items-start gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className={cn(IMG, "h-1.5 w-1.5 rounded-full")} />
          <span className={cn(BAR, "h-0.5 w-full")} />
        </span>
        {/* The contact card — the one element this layout is named for. */}
        <span className="flex w-7 flex-col gap-0.5 rounded-[2px] border border-primary/40 bg-primary/10 p-1">
          <span className={cn(BAR, "h-1 w-full bg-muted-foreground/60")} />
          <span className={cn(CTA, "h-1 w-4/5")} />
        </span>
        <span className="flex w-4 flex-col gap-0.5">
          <span className={cn(BAR, "h-0.5 w-3/5 bg-muted-foreground/60")} />
          <span className={cn(BAR, "h-0.5 w-full")} />
          <span className={cn(BAR, "h-0.5 w-4/5")} />
        </span>
      </span>
    </Frame>
  ),
  "footer:newsletter": (
    <Frame className="justify-end">
      <span className="flex items-start gap-2 rounded-[2px] border border-border bg-background p-1.5">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className={cn(BAR, "h-0.5 w-2/3 bg-muted-foreground/60")} />
          {/* The sign-up row: a field and its button. */}
          <span className="flex items-center gap-0.5">
            <span className={cn(BOX, "h-1.5 flex-1")} />
            <span className={cn(CTA, "h-1.5 w-3")} />
          </span>
        </span>
        {[0, 1].map((i) => (
          <span key={i} className="flex w-5 flex-col gap-0.5">
            <span className={cn(BAR, "h-0.5 w-3/5 bg-muted-foreground/60")} />
            <span className={cn(BAR, "h-0.5 w-full")} />
            <span className={cn(BAR, "h-0.5 w-4/5")} />
          </span>
        ))}
      </span>
    </Frame>
  ),

  /* ------------------------------------------------------------ checkout */
  "checkout:single-page": (
    <Frame>
      <TopBar />
      <span className="flex flex-1 gap-1">
        <span className="flex flex-1 flex-col gap-1">
          <span className={cn(BOX, "h-2 w-full")} />
          <span className={cn(BOX, "h-2 w-full")} />
          <span className={cn(CTA, "h-2 w-2/3")} />
        </span>
        <span className={cn(BOX, "w-1/3")} />
      </span>
    </Frame>
  ),
  "checkout:multi-step": (
    <Frame>
      <span className="flex flex-none items-center gap-1">
        <span className={cn(CTA, "h-1.5 w-1.5 rounded-full")} />
        <span className={cn(BAR, "h-0.5 flex-1")} />
        <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
        <span className={cn(BAR, "h-0.5 flex-1")} />
        <span className={cn(BAR, "h-1.5 w-1.5 rounded-full")} />
      </span>
      <span className="flex flex-1 flex-col justify-center gap-1">
        <span className={cn(BOX, "h-2 w-full")} />
        <span className={cn(CTA, "h-2 w-1/2")} />
      </span>
    </Frame>
  ),
  /* The opposite of multi-step: nothing is hidden behind a step, so every
     section is on screen at once, numbered, over large fields. */
  "checkout:guided": (
    <Frame className="justify-center gap-1.5 p-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={cn(BAR, "size-1.5 flex-none rounded-full bg-muted-foreground/60")} />
          <span className={cn(BOX, "h-2 flex-1")} />
        </span>
      ))}
    </Frame>
  ),
  /* Two columns and NO boxes — the order on the left, the form on the right,
     separated by nothing but space. */
  "checkout:editorial": (
    <Frame className="flex-row items-stretch gap-2 p-2">
      <span className="flex w-2/5 flex-col gap-1">
        <span className={cn(IMG, "h-5 w-full")} />
        <span className={cn(BAR, "h-1 w-3/4")} />
      </span>
      <span className="flex flex-1 flex-col justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-px w-full bg-border" />
        ))}
        <span className={cn(CTA, "h-2 w-2/3")} />
      </span>
    </Frame>
  ),

  /* --------------------------------------------------------------- shell
     The only axis that changes the building rather than what is inside it, so
     both sketches show the whole PAGE — header included — not a component. */
  "shell:stacked": (
    <Frame>
      <TopBar />
      <Cards n={3} tall />
    </Frame>
  ),
  "shell:rail": (
    <Frame>
      <TopBar />
      <span className="flex flex-1 gap-1">
        <span className="flex w-1/4 flex-col gap-1 border-r border-border pr-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn(BAR, "h-1 w-full")} />
          ))}
        </span>
        <Cards n={2} tall />
      </span>
    </Frame>
  ),

  /* ----------------------------------------------------------- cart layout */
  "cartLayout:panel": (
    <Frame className="flex-row gap-1.5 p-2">
      <span className={cn(BOX, "flex flex-1 flex-col justify-center gap-1 p-1")}>
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-1">
            <span className={cn(IMG, "size-3 flex-none")} />
            <span className={cn(BAR, "h-1 flex-1")} />
          </span>
        ))}
      </span>
      <span className={cn(BOX, "flex w-1/3 flex-col justify-end gap-1 p-1")}>
        <span className={cn(BAR, "h-1 w-full")} />
        <span className={cn(CTA, "h-2 w-full")} />
      </span>
    </Frame>
  ),
  // Thin rows, and the total pinned along the bottom rather than beside them.
  "cartLayout:compact": (
    <Frame className="gap-1 p-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={cn(IMG, "size-2 flex-none")} />
          <span className={cn(BAR, "h-0.5 flex-1")} />
        </span>
      ))}
      <span className={cn(CTA, "mt-auto h-2 w-full")} />
    </Frame>
  ),
  "cartLayout:cards": (
    <Frame className="gap-1.5 p-2">
      {[0, 1].map((i) => (
        <span key={i} className={cn(BOX, "flex flex-1 items-center gap-1.5 p-1")}>
          <span className={cn(IMG, "h-full w-5 flex-none")} />
          <span className={cn(BAR, "h-1 flex-1")} />
        </span>
      ))}
    </Frame>
  ),
  // Large photos with hairlines between them and no boxes anywhere.
  "cartLayout:editorial": (
    <Frame className="gap-0 p-2">
      {[0, 1].map((i) => (
        <span
          key={i}
          className={cn(
            "flex flex-1 items-center gap-1.5 py-1",
            i === 0 && "border-b border-border",
          )}
        >
          <span className={cn(IMG, "h-full w-6 flex-none")} />
          <span className={cn(BAR, "h-1 flex-1")} />
        </span>
      ))}
    </Frame>
  ),

  /* -------------------------------------------------------- content layout */
  "contentLayout:centered": (
    <Frame className="items-center justify-center gap-1 p-2">
      <span className={cn(BAR, "h-1.5 w-1/2 bg-muted-foreground/60")} />
      <span className="block h-px w-2/3 bg-border" />
      <span className={cn(BAR, "h-0.5 w-3/5")} />
      <span className={cn(BAR, "h-0.5 w-2/5")} />
    </Frame>
  ),
  "contentLayout:banner": (
    <Frame className="gap-1.5 p-2">
      <span className={cn(CTA, "h-3 w-full")} />
      <span className={cn(BOX, "flex flex-1 flex-col justify-center gap-1 p-1")}>
        <span className={cn(BAR, "h-0.5 w-full")} />
        <span className={cn(BAR, "h-0.5 w-2/3")} />
      </span>
    </Frame>
  ),
  // Tinted block, not the brand band — the difference from `banner` is the
  // weight of that header, so one is `IMG` and the other `CTA`.
  "contentLayout:panel": (
    <Frame className="gap-1.5 p-2">
      <span className={cn(IMG, "flex h-3 items-center px-1")}>
        <span className={cn(BAR, "h-1 w-1/3")} />
      </span>
      <span className={cn(BOX, "flex flex-1 flex-col justify-center gap-1 p-1")}>
        <span className={cn(BAR, "h-0.5 w-full")} />
        <span className={cn(BAR, "h-0.5 w-2/3")} />
      </span>
    </Frame>
  ),
  "contentLayout:editorial": (
    <Frame className="justify-center gap-1.5 p-2">
      <span className={cn(BAR, "h-2 w-3/4 bg-muted-foreground/25")} />
      <span className={cn(BAR, "h-0.5 w-full")} />
      <span className={cn(BAR, "h-0.5 w-5/6")} />
      <span className={cn(BAR, "h-0.5 w-2/3")} />
    </Frame>
  ),

  /* -------------------------------------------------------- account layout */
  "accountLayout:sidebar": (
    <Frame className="flex-row gap-1.5 p-2">
      <span className="flex w-1/3 flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(BAR, "h-1 w-full")} />
        ))}
      </span>
      <span className={cn(BOX, "flex-1")} />
    </Frame>
  ),
  "accountLayout:tabs": (
    <Frame className="gap-1 p-2">
      <span className={cn(CTA, "h-2.5 w-full")} />
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn(BAR, "h-1 flex-1")} />
        ))}
      </span>
      <span className={cn(BOX, "flex-1")} />
    </Frame>
  ),
  "accountLayout:panel": (
    <Frame className="p-2">
      <span className="grid flex-1 grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn(BOX, "h-full w-full")} />
        ))}
      </span>
    </Frame>
  ),
  // No cards and no icons — a quiet list, which is the entire option.
  "accountLayout:editorial": (
    <Frame className="justify-center gap-1.5 p-2">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn(BAR, "h-1 w-2/3")} />
      ))}
    </Frame>
  ),
};

/** Which options have a wireframe — for the coverage guard. See `SKETCHES`. */
export const SKETCH_KEYS = Object.keys(SKETCHES);

export function TemplateSketch({
  templateKey,
  value,
}: {
  templateKey: string;
  value: string;
}) {
  return <>{SKETCHES[`${templateKey}:${value}`] ?? <Frame />}</>;
}
