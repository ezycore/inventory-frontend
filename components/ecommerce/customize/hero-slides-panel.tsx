"use client";
// coding-standard: maintained

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { useUploadStorefrontImage } from "@/services/api";
import type { StorefrontHeroSlide } from "@/types";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SlideThumb } from "@/components/ecommerce/customize/slide-thumb";

export const MAX_HERO_SLIDES = 5;

const newHeroSlide = (): StorefrontHeroSlide => ({
  title: "",
  badge: "",
  subtitle: "",
  buttonLabel: "",
  link: "",
});

/**
 * Edit-in-place hero-slides panel: it takes over the Customize rail so the live
 * preview stays visible and repaints as you type — never a modal.
 *
 * It owns no persistence and no snapshot. The slides it edits are the page's
 * draft, so "Done" simply returns to the rail and the page's one Save ships
 * them; Discard on the save bar reverts these along with everything else. Only
 * image uploads hit the server here, because a file has to exist before it can
 * be referenced.
 */
export function HeroSlidesPanel({
  slides,
  setSlides,
  initialExpanded,
  onClose,
}: {
  slides: StorefrontHeroSlide[];
  setSlides: (v: StorefrontHeroSlide[]) => void;
  /** Slide to open on entry — the row whose pencil was clicked. */
  initialExpanded?: number;
  onClose: () => void;
}) {
  const upload = useUploadStorefrontImage();
  const fileInput = useRef<HTMLInputElement>(null);
  // State, not a ref: the row renders "Uploading…" from it, and a ref read
  // during render doesn't repaint when it changes.
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(
    initialExpanded ?? (slides.length === 0 ? 0 : null),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (i: number, p: Partial<StorefrontHeroSlide>) =>
    setSlides(slides.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  const remove = (i: number) => {
    setSlides(slides.filter((_, idx) => idx !== i));
    setExpanded(null);
  };
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= slides.length) return;
    const next = [...slides];
    [next[i], next[t]] = [next[t], next[i]];
    setSlides(next);
    if (expanded === i) setExpanded(t);
    else if (expanded === t) setExpanded(i);
  };
  const add = () => {
    setSlides([...slides, newHeroSlide()]);
    setExpanded(slides.length);
  };

  const pickImage = (i: number) => {
    setUploadTarget(i);
    fileInput.current?.click();
  };
  const onFile = async (file: File, target: number) => {
    try {
      const res = await upload.mutateAsync(file);
      if (res.data) patch(target, { image: res.data });
    } catch {
      // handleMutationError already toasted; keep the slide unchanged.
    } finally {
      setUploadTarget(null);
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-left-6 flex h-full min-h-0 flex-col gap-0 p-0 shadow-none duration-200">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to store parts"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold">Hero slides</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {slides.length} / {MAX_HERO_SLIDES}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={slides.length >= MAX_HERO_SLIDES}
          onClick={add}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add slide
        </Button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTarget !== null) void onFile(file, uploadTarget);
          e.target.value = "";
        }}
      />

      {/* Rows — fills the fixed-height rail; header and footer stay pinned. */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {slides.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-muted-foreground">
            No slides yet — add your first promo.
          </p>
        ) : (
          slides.map((s, i) => (
            <div key={i} className="rounded-lg border">
              <button
                type="button"
                onClick={() => setExpanded(expanded === i ? null : i)}
                aria-expanded={expanded === i}
                className="flex w-full items-center gap-2.5 p-2.5 text-left"
              >
                <SlideThumb slide={s} className="h-8 w-[52px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {s.title.trim() || "Untitled slide"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {[s.badge?.trim(), s.image ? "has image" : "brand panel"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 flex-none text-muted-foreground transition-transform",
                    expanded === i && "rotate-180",
                  )}
                />
              </button>

              {expanded === i && (
                <div className="space-y-2.5 border-t border-dashed p-2.5">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={upload.isPending}
                      onClick={() => pickImage(i)}
                    >
                      {upload.isPending && uploadTarget === i
                        ? "Uploading…"
                        : s.image
                          ? "Replace image"
                          : "Upload image"}
                    </Button>
                    {s.image && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => patch(i, { image: null })}
                      >
                        Remove image
                      </Button>
                    )}
                    <span className="ml-auto flex items-center text-muted-foreground">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                        aria-label="Move slide up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === slides.length - 1}
                        onClick={() => move(i, 1)}
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                        aria-label="Move slide down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="rounded p-1 hover:text-red-600"
                        aria-label="Remove slide"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                  {/* The hero is ~2.6:1 on desktop but crops to a tall centre
                      strip on mobile, and the desktop scrim darkens the left
                      where this copy sits — hence both halves of this advice. */}
                  <p className="text-xs leading-snug text-muted-foreground">
                    1600 × 640 px (2.5:1) works best. Keep the subject right of
                    centre and away from the edges — the text sits on the left,
                    and phones crop to a tall centre strip.
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={s.title}
                      onChange={(e) => patch(i, { title: e.target.value })}
                      maxLength={90}
                      placeholder="Mega sale coming on 12th December"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Badge (optional)</Label>
                      <Input
                        value={s.badge ?? ""}
                        onChange={(e) => patch(i, { badge: e.target.value })}
                        maxLength={40}
                        placeholder="Coming soon"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Button label (optional)</Label>
                      <Input
                        value={s.buttonLabel ?? ""}
                        onChange={(e) => patch(i, { buttonLabel: e.target.value })}
                        maxLength={30}
                        placeholder="Shop now"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle (optional)</Label>
                    <Input
                      value={s.subtitle ?? ""}
                      onChange={(e) => patch(i, { subtitle: e.target.value })}
                      maxLength={160}
                      placeholder="Storewide deals — one day only."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Button link</Label>
                    <Input
                      value={s.link ?? ""}
                      onChange={(e) => patch(i, { link: e.target.value })}
                      maxLength={300}
                      placeholder="/products or https://…"
                      className="h-9"
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3 border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Saved with the rest of the page.
        </p>
        <Button size="sm" className="ml-auto" onClick={onClose}>
          Done
        </Button>
      </div>
    </Card>
  );
}
