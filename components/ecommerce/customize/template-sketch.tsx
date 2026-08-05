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
        "flex h-16 w-full flex-col gap-1 rounded-md border bg-muted/30 p-1.5",
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

  /* -------------------------------------------------------------- header */
  "header:classic": (
    <Frame className="justify-center">
      <span className="flex items-center gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        <span className={cn(BAR, "h-1.5 w-5 bg-muted-foreground/60")} />
        <span className="ml-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn(BAR, "h-1 w-3")} />
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

  /* -------------------------------------------------------------- footer */
  "footer:columns": (
    <Frame className="justify-end">
      <span className="flex gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="flex flex-1 flex-col gap-0.5">
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
      <span className="flex items-center justify-center gap-1.5 rounded-[2px] border border-border bg-background p-2">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn(BAR, "h-0.5 w-3")} />
        ))}
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
      <span className="flex gap-1.5 rounded-[2px] border border-border bg-background p-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="flex flex-1 flex-col gap-0.5">
            <span className={cn(BAR, "h-0.5 w-3/5 bg-muted-foreground/60")} />
            <span className={cn(BAR, "h-0.5 w-full")} />
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
};

export function TemplateSketch({
  templateKey,
  value,
}: {
  templateKey: string;
  value: string;
}) {
  return <>{SKETCHES[`${templateKey}:${value}`] ?? <Frame />}</>;
}
