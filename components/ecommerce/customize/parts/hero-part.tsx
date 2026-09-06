"use client";
// coding-standard: maintained

import { useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
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
import { PhotoFitField } from "@/components/ecommerce/customize/photo-fit-field";
import { MobileHeroImageField } from "@/components/ecommerce/customize/mobile-hero-image-field";
import {
  PartBlock,
  PartHint,
  PartLabel,
} from "@/components/ecommerce/customize/part-group";
import { SlideThumb } from "@/components/ecommerce/customize/slide-thumb";
import { MAX_HERO_SLIDES } from "@/components/ecommerce/customize/hero-slides-panel";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { hasHeroSlideContent } from "@/lib/storefront-hero-slide";
import { resolveSections } from "@/lib/storefront-templates";
import { HOME_PRESET_SECTIONS, isSectionId } from "@/lib/storefront-section-ids";

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
  const emptySlides = slides.filter((s) => !hasHeroSlideContent(s)).length;

  /* `heroApplies = draft.templates.home !== "minimal"` stood here until
     2026-09-06, hiding this whole panel — slides, banner, copy — from anyone on
     the Minimal layout, because Minimal composed `hero-manifesto`, which ignored
     all of it. That section is gone: Minimal composes `hero-open` now, which
     shows both. The gate would have hidden controls that work. */

  // Which hero the page actually composes. Only `hero-open` has an alignment
  // worth asking about — `hero-card` sets its copy beside a photo and
  // `hero-fullbleed` lays type over one — so the control appears only when the
  // answer would change something a merchant can see.
  const { sections } = resolveSections(
    {
      theme: { homepageSections: draft.homepageSections },
      templates: { home: draft.templates.home },
    },
    { isSectionId, presets: HOME_PRESET_SECTIONS },
  );
  const hasOpenHero = sections.some((section) => section.type === "hero-open");

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

  // A focus point is coordinates on one specific photograph, so a replacement
  // starts centred rather than inheriting a crop aimed at the old image. The fit
  // stays: that is a preference for this slot, not a fact about the file.
  // Guarded, because an unconditional patch would turn `heroBanner: undefined`
  // into `{}` and light up the "Hero changed" save bar after an upload that
  // saved itself immediately — a change the merchant never made.
  const clearBannerFocal = () => {
    if (!draft.heroBanner?.focal) return;
    patch({ heroBanner: { ...draft.heroBanner, focal: undefined } });
  };

  const uploadBanner = (file: File) => {
    const fd = new FormData();
    fd.append("banner", file);
    media.mutate(fd);
    clearBannerFocal();
  };
  const removeBanner = () => {
    const fd = new FormData();
    fd.append("removeBanner", "true");
    media.mutate(fd);
    clearBannerFocal();
  };

  return (
    <>
      {hasOpenHero ? (
        <PartBlock
          label="Headline position"
          hint="Your open hero's badge, headline, text and buttons move together. Phones show the hero in one column either way, so this looks the same on both."
        >
          <div className="grid grid-cols-2 gap-2">
            <OptionCard
              selected={draft.heroAlign === "left"}
              onSelect={() => patch({ heroAlign: "left" })}
              label="Left"
              description="Reads as a shop — the default"
              icon={AlignLeft}
            />
            <OptionCard
              selected={draft.heroAlign === "center"}
              onSelect={() => patch({ heroAlign: "center" })}
              label="Centred"
              description="Reads as a statement"
              icon={AlignCenter}
            />
          </div>
        </PartBlock>
      ) : null}

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

      {usesSlides ? (
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
                  className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border bg-background p-2"
                >
                  <SlideThumb slide={s} className="h-8 w-[3.25rem]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {s.title?.trim() || (s.image || s.mobileImage ? "Image-only slide" : "Empty slide")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {[s.badge?.trim(), s.image ? "has image" : "brand panel"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="grid flex-none grid-cols-3 items-center text-muted-foreground">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:text-foreground disabled:opacity-30"
                      aria-label={`Move ${s.title?.trim() || "slide"} up`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === slides.length - 1}
                      onClick={() => move(i, 1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:text-foreground disabled:opacity-30"
                      aria-label={`Move ${s.title?.trim() || "slide"} down`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditSlide(i)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:text-foreground"
                      aria-label={`Edit ${s.title?.trim() || "slide"}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {emptySlides > 0 ? (
            <PartHint tone="warn">
              {emptySlides === 1 ? "One slide is" : `${emptySlides} slides are`} completely
              empty, so {emptySlides === 1 ? "it won't" : "they won't"} be shown on the
              shop. An image-only slide is valid.
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
          hint="Recommended desktop canvas: 1200 × 900 px (4:3). This is guidance, not a requirement—other home layouts adapt it using the selected fit and focus."
        />
        <p className="text-xs leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">
            Recommended desktop canvas: 1200 × 900 px (4:3).
          </span>{" "}
          This is guidance, not a requirement—other home layouts adapt it using
          the selected fit and focus.
        </p>
        {/* The banner sits in a different frame in every hero — 4:3, 4:5, or
            the full width of a card — so how it handles a frame it doesn't
            match is a property of the photo, and it follows the photo into
            whichever section is showing it. */}
        {settings.banner?.mediumUrl || settings.banner?.url ? (
          <PhotoFitField
            url={settings.banner.mediumUrl || settings.banner.url || ""}
            imageFit={draft.heroBanner?.imageFit}
            focal={draft.heroBanner?.focal}
            onChange={(next) => patch({ heroBanner: { ...draft.heroBanner, ...next } })}
          />
        ) : null}
        <MobileHeroImageField
          desktopUrl={settings.banner?.mediumUrl || settings.banner?.url}
          desktopFocal={draft.heroBanner?.focal}
          desktopRatio="4 / 3"
          image={draft.heroBanner?.mobileImage}
          focal={draft.heroBanner?.mobileFocal}
          imageFit={draft.heroBanner?.imageFit}
          onImageReplace={(mobileImage) =>
            patch({
              heroBanner: {
                ...draft.heroBanner,
                mobileImage,
                mobileFocal: undefined,
              },
            })
          }
          onFocalChange={(mobileFocal) =>
            patch({ heroBanner: { ...draft.heroBanner, mobileFocal } })
          }
        />
      </PartBlock>

      {!usesSlides ? (
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
