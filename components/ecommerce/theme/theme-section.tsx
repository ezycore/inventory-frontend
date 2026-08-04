"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import {
  Droplets,
  GalleryHorizontal,
  Image as ImageIcon,
  Palette,
  PanelBottom,
  PanelTop,
} from "lucide-react";
import {
  useUpdateStorefrontMedia,
  useUpdateStorefrontSettings,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { getPreset } from "@/lib/storefront-theme";
import type {
  StorefrontHeroBanner,
  StorefrontHeroSlide,
  StorefrontSettings,
  StorefrontTrustBadge,
} from "@/types";
import { Button } from "@/ui/components/button";
import { SlideThumb } from "@/components/ecommerce/slide-thumb";
import {
  BannerHeroFields,
  cleanHeroBanner,
} from "@/components/ecommerce/theme/banner-hero-fields";
import { ColorsBody } from "@/components/ecommerce/theme/colors-group";
import { FooterBody } from "@/components/ecommerce/theme/footer-group";
import { MediaField } from "@/components/ecommerce/theme/media-field";
import { PresetTiles } from "@/components/ecommerce/theme/preset-group";
import { ThemeCapsule } from "@/components/ecommerce/theme/theme-capsule";
import { ThemeGroup } from "@/components/ecommerce/theme/theme-group";

type GroupId = "preset" | "colors" | "logo" | "slides" | "banner" | "footer";

/**
 * Customize → Theme: one settings surface — a live theme capsule pinned on
 * top, six collapsible groups with state summaries, and a sticky save bar
 * with an unsaved-changes indicator. Save payload and preview streaming are
 * identical to the old stacked-cards layout; media uploads still save
 * immediately (independent of "Save theme").
 */
export function ThemeSection({
  settings,
  brandColor,
  accentColor,
  setBrandColor,
  setAccentColor,
  badges,
  setBadges,
  heroSlides,
  heroBanner,
  setHeroBanner,
  onManageSlides,
}: {
  settings: StorefrontSettings;
  brandColor: string;
  accentColor: string;
  setBrandColor: (v: string) => void;
  setAccentColor: (v: string) => void;
  badges: StorefrontTrustBadge[];
  setBadges: (v: StorefrontTrustBadge[]) => void;
  heroSlides: StorefrontHeroSlide[];
  heroBanner: StorefrontHeroBanner;
  setHeroBanner: (v: StorefrontHeroBanner) => void;
  onManageSlides: () => void;
}) {
  const save = useUpdateStorefrontSettings();
  const media = useUpdateStorefrontMedia();
  // The shop inherits the organization logo unless a store-specific one is
  // uploaded (public payload falls back server-side the same way).
  const orgLogo = useAuthStore((s) => s.user?.organization?.logo);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  // One mutation serves both fields — inspect its FormData so only the field
  // actually uploading/removing shows the busy spinner.
  const pendingMedia = media.isPending
    ? media.variables?.has("logo") || media.variables?.has("removeLogo")
      ? "logo"
      : "banner"
    : null;

  const t = settings.theme ?? {};
  const [preset, setPreset] = useState(t.preset ?? "default");
  const [footerText, setFooterText] = useState(t.footerText ?? "");
  const [open, setOpen] = useState<GroupId | null>("preset");
  const [dirty, setDirty] = useState(false);

  const toggle = (id: GroupId) => setOpen((o) => (o === id ? null : id));
  /** Wrap a setter so any edit flips the unsaved-changes indicator. */
  const touch =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      fn(v);
      setDirty(true);
    };

  const pickPreset = (id: string) => {
    setPreset(id);
    const def = getPreset(id);
    setBrandColor(def.brandColor);
    setAccentColor(def.accentColor);
    setDirty(true);
  };

  const setBadge = (i: number, patch: Partial<StorefrontTrustBadge>) => {
    setBadges(badges.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
    setDirty(true);
  };

  const submit = () => {
    save.mutate(
      {
        theme: {
          preset,
          brandColor,
          accentColor,
          footerText: footerText.trim() || undefined,
        },
        // Keep all three slots (empty = default) so positions survive a reload.
        // (Hero slides save from their own panel, not here.)
        trustBadges: badges.map((b) => ({ text: b.text.trim(), icon: b.icon })),
        heroBanner: cleanHeroBanner(heroBanner),
      },
      { onSuccess: () => setDirty(false) },
    );
  };

  const uploadMedia = (field: "logo" | "banner", file: File) => {
    const fd = new FormData();
    fd.append(field, file);
    media.mutate(fd);
  };

  const removeMedia = (field: "logo" | "banner") => {
    const fd = new FormData();
    fd.append(field === "logo" ? "removeLogo" : "removeBanner", "true");
    media.mutate(fd);
  };

  // Collapsed-state summaries: each group's one-line current state.
  const presetDef = getPreset(preset);
  const colorsCustomized =
    brandColor !== presetDef.brandColor || accentColor !== presetDef.accentColor;
  const savedSlides = heroSlides.filter((s) => s.title.trim()).length;
  const bannerFieldCount = Object.values(cleanHeroBanner(heroBanner)).filter(
    Boolean,
  ).length;
  const customBadges = badges.filter((b) => b.text.trim()).length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <ThemeCapsule
        brandColor={brandColor}
        accentColor={accentColor}
        presetLabel={colorsCustomized ? `${presetDef.label} · customized` : presetDef.label}
      />

      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        <ThemeGroup
          icon={Palette}
          title="Preset"
          summary={`${presetDef.label} — you can fine-tune below`}
          open={open === "preset"}
          onToggle={() => toggle("preset")}
        >
          <PresetTiles preset={preset} onPick={pickPreset} />
        </ThemeGroup>

        <ThemeGroup
          icon={Droplets}
          title="Brand colors"
          summary={
            <>
              <span className="mr-1.5 inline-flex align-[-2px]">
                <span
                  className="h-2.5 w-2.5 rounded-full border"
                  style={{ background: brandColor }}
                />
                <span
                  className="-ml-1 h-2.5 w-2.5 rounded-full border"
                  style={{ background: accentColor }}
                />
              </span>
              {brandColor} · {accentColor}
            </>
          }
          open={open === "colors"}
          onToggle={() => toggle("colors")}
        >
          <ColorsBody
            brandColor={brandColor}
            accentColor={accentColor}
            setBrandColor={touch(setBrandColor)}
            setAccentColor={touch(setAccentColor)}
          />
        </ThemeGroup>

        <ThemeGroup
          icon={ImageIcon}
          title="Logo"
          summary={
            settings.logo
              ? "Custom store logo"
              : orgLogo
                ? "Using your organization logo"
                : "Not set — the header shows your store name"
          }
          open={open === "logo"}
          onToggle={() => toggle("logo")}
        >
          <MediaField
            label="Logo"
            url={
              settings.logo?.thumbnailUrl ||
              settings.logo?.url ||
              orgLogo?.thumbnailUrl ||
              orgLogo?.url
            }
            inputRef={logoInput}
            disabled={media.isPending}
            busy={pendingMedia === "logo"}
            onPick={(file) => uploadMedia("logo", file)}
            onRemove={settings.logo ? () => removeMedia("logo") : undefined}
            hint={
              settings.logo
                ? "600 × 200 px (up to 3:1) works best — the header caps it at 42px tall. Remove it to fall back to your organization logo."
                : "600 × 200 px (up to 3:1) works best. The store inherits your organization logo — upload only if the shop needs a different mark."
            }
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            {settings.logo
              ? "Uploads save immediately — no need to press Save theme."
              : orgLogo
                ? "Currently showing your organization logo (from org settings). Uploading here overrides it for the store only."
                : "Upload here, or set an organization logo once in org settings to use it everywhere."}
          </p>
        </ThemeGroup>

        <ThemeGroup
          icon={GalleryHorizontal}
          title="Hero slides"
          summary={
            heroSlides.length === 0
              ? "No slides — the home page shows the static hero"
              : `${heroSlides.length} ${heroSlides.length === 1 ? "slide" : "slides"} rotating on your home page`
          }
          open={open === "slides"}
          onToggle={() => toggle("slides")}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
              {heroSlides.map((s, i) => (
                <SlideThumb key={i} slide={s} className="h-8 w-[3.25rem] flex-none" />
              ))}
              {heroSlides.length === 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Slides rotate above the static hero once added.
                </span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={onManageSlides}>
              Manage slides
            </Button>
          </div>
          {savedSlides < heroSlides.length && (
            <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
              Slides without a title aren&apos;t shown on the shop.
            </p>
          )}
        </ThemeGroup>

        <ThemeGroup
          icon={PanelTop}
          title="Banner hero"
          summary={`Image ${settings.banner ? "✓" : "not set"} · ${
            bannerFieldCount === 0
              ? "standard copy"
              : `${bannerFieldCount} field${bannerFieldCount === 1 ? "" : "s"} customized`
          }`}
          open={open === "banner"}
          onToggle={() => toggle("banner")}
        >
          <div className="space-y-3">
            <MediaField
              label="Banner image"
              url={settings.banner?.mediumUrl || settings.banner?.url}
              inputRef={bannerInput}
              disabled={media.isPending}
              busy={pendingMedia === "banner"}
              onPick={(file) => uploadMedia("banner", file)}
              onRemove={settings.banner ? () => removeMedia("banner") : undefined}
              hint="1200 × 900 px (4:3) works best, subject centred. Uploads save immediately. Also the preview image for shared store links — even when the hero shows slides."
            />
            <BannerHeroFields value={heroBanner} onChange={touch(setHeroBanner)} />
          </div>
        </ThemeGroup>

        <ThemeGroup
          icon={PanelBottom}
          title="Footer"
          summary={`${footerText.trim() ? "© text set" : "Default © text"} · ${customBadges > 0 ? `${customBadges} custom badge${customBadges === 1 ? "" : "s"}` : "default badges"}`}
          open={open === "footer"}
          onToggle={() => toggle("footer")}
        >
          <FooterBody
            footerText={footerText}
            setFooterText={touch(setFooterText)}
            badges={badges}
            setBadge={setBadge}
          />
        </ThemeGroup>
      </div>

      <div className="flex flex-none items-center justify-between gap-3 border-t bg-muted/30 px-3.5 py-2.5">
        {dirty ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        ) : (
          <span />
        )}
        <Button size="sm" onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save theme"}
        </Button>
      </div>
    </div>
  );
}
