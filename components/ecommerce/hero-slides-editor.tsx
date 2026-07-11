"use client";
// coding-standard: maintained

import { useRef } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2 } from "lucide-react";
import { useUploadHeroSlideImage } from "@/services/api";
import type { StorefrontHeroSlide } from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

export const MAX_HERO_SLIDES = 5;

export const newHeroSlide = (): StorefrontHeroSlide => ({
  title: "",
  badge: "",
  subtitle: "",
  buttonLabel: "",
  link: "",
});

/**
 * Customize → Theme → Hero slides. Edits the draft `heroSlides` lifted into
 * CustomizeWorkspace (so the live preview repaints as you type); persisted by
 * the Theme section's "Save theme" via the settings PATCH.
 */
export function HeroSlidesEditor({
  slides,
  setSlides,
}: {
  slides: StorefrontHeroSlide[];
  setSlides: (v: StorefrontHeroSlide[]) => void;
}) {
  const upload = useUploadHeroSlideImage();
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<number>(0);

  const patch = (i: number, p: Partial<StorefrontHeroSlide>) =>
    setSlides(slides.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  const remove = (i: number) => setSlides(slides.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= slides.length) return;
    const next = [...slides];
    [next[i], next[t]] = [next[t], next[i]];
    setSlides(next);
  };

  const pickImage = (i: number) => {
    uploadTarget.current = i;
    fileInput.current?.click();
  };
  const onFile = async (file: File) => {
    try {
      const res = await upload.mutateAsync(file);
      if (res.data) patch(uploadTarget.current, { image: res.data });
    } catch {
      // handleMutationError already toasted; keep the slide unchanged.
    }
  };

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Hero slides</h3>
          <p className="text-xs text-muted-foreground">
            Rotating promos at the top of your home page (Classic &amp; Hero
            Split templates). No slides → the standard hero. Slides without an
            image get a brand-tinted panel.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={slides.length >= MAX_HERO_SLIDES}
          onClick={() => setSlides([...slides, newHeroSlide()])}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add
        </Button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
          e.target.value = "";
        }}
      />

      {slides.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No slides yet — your store shows the standard hero.
        </p>
      ) : (
        <div className="space-y-3">
          {slides.map((s, i) => (
            <div key={i} className="space-y-2.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-none flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="text-muted-foreground disabled:opacity-30"
                    aria-label="Move slide up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={i === slides.length - 1}
                    onClick={() => move(i, 1)}
                    className="text-muted-foreground disabled:opacity-30"
                    aria-label="Move slide down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative h-14 w-24 flex-none overflow-hidden rounded-md border bg-muted/40">
                  {s.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.image.thumbnailUrl || s.image.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={upload.isPending}
                    onClick={() => pickImage(i)}
                  >
                    {upload.isPending && uploadTarget.current === i
                      ? "Uploading…"
                      : s.image
                        ? "Replace image"
                        : "Upload image"}
                  </Button>
                  {s.image && (
                    <button
                      type="button"
                      onClick={() => patch(i, { image: null })}
                      className="text-left text-xs text-red-600"
                    >
                      Remove image
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex-none self-start text-muted-foreground hover:text-red-600"
                  aria-label="Remove slide"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={s.title}
                    onChange={(e) => patch(i, { title: e.target.value })}
                    maxLength={90}
                    placeholder="Mega sale coming on 12th December"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Badge (optional)</Label>
                  <Input
                    value={s.badge ?? ""}
                    onChange={(e) => patch(i, { badge: e.target.value })}
                    maxLength={40}
                    placeholder="Coming soon"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Button label (optional)</Label>
                  <Input
                    value={s.buttonLabel ?? ""}
                    onChange={(e) => patch(i, { buttonLabel: e.target.value })}
                    maxLength={30}
                    placeholder="Shop now"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Subtitle (optional)</Label>
                  <Input
                    value={s.subtitle ?? ""}
                    onChange={(e) => patch(i, { subtitle: e.target.value })}
                    maxLength={160}
                    placeholder="Storewide deals — one day only."
                    className="h-8"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Button link</Label>
                  <Input
                    value={s.link ?? ""}
                    onChange={(e) => patch(i, { link: e.target.value })}
                    maxLength={300}
                    placeholder="/products or https://…"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
