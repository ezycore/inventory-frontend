"use client";
// coding-standard: maintained

import { useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Pencil,
  Plus,
} from "lucide-react";
import { useUpdateStorefrontMedia } from "@/services/api";
import type { StorefrontHeroSlide, StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { OptionCard } from "@/ui/components/option-card";
import { BannerHeroFields } from "@/components/ecommerce/customize/banner-hero-fields";
import { MediaField } from "@/components/ecommerce/customize/media-field";
import {
  PartBlock,
  PartHint,
  PartLabel,
} from "@/components/ecommerce/customize/part-group";
import { SlideThumb } from "@/components/ecommerce/customize/slide-thumb";
import { MAX_HERO_SLIDES } from "@/components/ecommerce/customize/hero-slides-panel";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Hero — what the top of the home page shows, and its content. The source
 * switch used to live in Templates while the slides and the banner copy lived
 * in Theme, so choosing "slides" and then writing one took two tabs and two
 * saves.
 *
 * The banner image is uploaded here even when slides are showing: it doubles as
 * the preview image for shared store links.
 */
export function HeroPart({
  settings,
  draft,
  patch,
  patchTemplate,
  onEditSlide,
}: {
  settings: StorefrontSettings;
  /** Opens the slides panel, expanded on the given slide. */
  onEditSlide: (index: number) => void;
} & Pick<CustomizeDraftApi, "draft" | "patch" | "patchTemplate">) {
  const media = useUpdateStorefrontMedia();
  const bannerInput = useRef<HTMLInputElement>(null);

  const slides = draft.heroSlides;
  const usesSlides = draft.templates.hero !== "banner";
  const heroApplies = draft.templates.home !== "minimal";
  const untitled = slides.filter((s) => !s.title.trim()).length;

  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= slides.length) return;
    const next = [...slides];
    [next[i], next[t]] = [next[t], next[i]];
    patch({ heroSlides: next });
  };

  const addSlide = () => {
    const next: StorefrontHeroSlide[] = [
      ...slides,
      { title: "", badge: "", subtitle: "", buttonLabel: "", link: "" },
    ];
    patch({ heroSlides: next });
    onEditSlide(next.length - 1);
  };

  const uploadBanner = (file: File) => {
    const fd = new FormData();
    fd.append("banner", file);
    media.mutate(fd);
  };
  const removeBanner = () => {
    const fd = new FormData();
    fd.append("removeBanner", "true");
    media.mutate(fd);
  };

  return (
    <>
      {heroApplies ? (
        <PartBlock label="The hero shows">
          <div className="grid grid-cols-2 gap-2">
            <OptionCard
              selected={usesSlides}
              onSelect={() => patchTemplate("hero", "slides")}
              label="Slides carousel"
              description={
                slides.length === 0
                  ? "No slides yet — add one below"
                  : "Rotating promos you write below"
              }
              tone={slides.length === 0 ? "warn" : "muted"}
              icon={GalleryHorizontalEnd}
            />
            <OptionCard
              selected={!usesSlides}
              onSelect={() => patchTemplate("hero", "banner")}
              label="Static banner"
              description="One image with your own headline"
              icon={ImageIcon}
            />
          </div>
        </PartBlock>
      ) : (
        <PartHint>
          The Minimal home layout has a typographic hero, so neither slides nor
          the banner appear on it. Your banner image is still used as the preview
          for shared store links.
        </PartHint>
      )}

      {heroApplies && usesSlides ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <PartLabel>
              Slides · {slides.length} of {MAX_HERO_SLIDES}
            </PartLabel>
            <Button
              size="sm"
              variant="outline"
              disabled={slides.length >= MAX_HERO_SLIDES}
              onClick={addSlide}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add slide
            </Button>
          </div>
          {slides.length === 0 ? (
            <PartHint>
              No slides yet — the home page falls back to the static banner.
            </PartHint>
          ) : (
            <div className="grid gap-1.5">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg border bg-background p-2"
                >
                  <SlideThumb slide={s} className="h-8 w-[3.25rem]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {s.title.trim() || "Untitled slide"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {[s.badge?.trim(), s.image ? "has image" : "brand panel"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex flex-none items-center text-muted-foreground">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded p-1 hover:text-foreground disabled:opacity-30"
                      aria-label={`Move ${s.title.trim() || "slide"} up`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === slides.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded p-1 hover:text-foreground disabled:opacity-30"
                      aria-label={`Move ${s.title.trim() || "slide"} down`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditSlide(i)}
                      className="rounded p-1 hover:text-foreground"
                      aria-label={`Edit ${s.title.trim() || "slide"}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {untitled > 0 ? (
            <PartHint tone="warn">
              {untitled === 1 ? "One slide has" : `${untitled} slides have`} no
              title, so {untitled === 1 ? "it won't" : "they won't"} be shown on
              the shop.
            </PartHint>
          ) : null}
        </div>
      ) : null}

      <PartBlock
        label="Banner image"
        hint="Uploads save immediately. This is also the preview image when someone shares your store link — even while the hero shows slides."
      >
        <MediaField
          label="Banner image"
          url={settings.banner?.mediumUrl || settings.banner?.url}
          inputRef={bannerInput}
          disabled={media.isPending}
          busy={media.isPending}
          onPick={uploadBanner}
          onRemove={settings.banner ? removeBanner : undefined}
          hint="1200 × 900 px (4:3) works best, subject centred."
        />
      </PartBlock>

      {heroApplies && !usesSlides ? (
        <PartBlock label="Banner headline">
          <BannerHeroFields
            value={draft.heroBanner}
            onChange={(heroBanner) => patch({ heroBanner })}
          />
        </PartBlock>
      ) : null}
    </>
  );
}
