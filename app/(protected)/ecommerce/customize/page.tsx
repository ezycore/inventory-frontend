"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ExternalLink,
  Lock,
  Monitor,
  RotateCw,
  Smartphone,
} from "lucide-react";
import {
  useGetStorefrontSettings,
  useStorefrontCollections,
  useUpdateStorefrontMedia,
  useUpdateStorefrontSettings,
} from "@/services/api";
import { THEME_PRESETS, getPreset } from "@/lib/storefront-theme";
import { resolveHeaderMenu } from "@/lib/storefront-templates";
import type { HeaderMenuSource } from "@/lib/storefront-client";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { storefrontUrl } from "@/lib/storefront-url";
import type {
  StorefrontHeroSlide,
  StorefrontMenuItem,
  StorefrontSettings,
  StorefrontTrustBadge,
} from "@/types";
import {
  toRowValue,
  type CollectionRowValue,
} from "@/components/ecommerce/collections/collection-row";
import { CollectionsPanel } from "@/components/ecommerce/collections/collections-panel";
import { NavigationSection } from "@/components/ecommerce/navigation/navigation-section";
import { HeroSlidesPanel } from "@/components/ecommerce/hero-slides-panel";
import { SlideThumb } from "@/components/ecommerce/slide-thumb";
import { HomeTemplateBlock } from "@/components/ecommerce/home-template-block";
import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Icon as SfIcon, type IconName } from "@/components/storefront/sf-icons";

type Option = { label: string; value: string };
type SectionId = "theme" | "templates" | "navigation";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "theme", label: "Theme" },
  { id: "templates", label: "Templates" },
  { id: "navigation", label: "Navigation" },
];

// Trust-badge editor (Rich footer). Rows seed empty with these defaults as
// placeholders/icons; unset rows fall back to the storefront's localized copy.
const BADGE_ICON_CHOICES: IconName[] = [
  "shield",
  "truck",
  "coins",
  "check",
  "star",
  "tag",
  "heart",
  "clock",
];
const DEFAULT_BADGES: StorefrontTrustBadge[] = [
  { text: "", icon: "shield" },
  { text: "", icon: "truck" },
  { text: "", icon: "coins" },
];
const BADGE_PLACEHOLDERS = [
  "100% authentic",
  "Same-day delivery",
  "Cash on delivery",
];

export default function CustomizePage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customize</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Design your storefront — theme, brand colors, logo, page layouts and
          navigation — with a live preview.
        </p>
      </div>
      {isLoading || !settings ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        // useSearchParams (section deep-link) needs a boundary to render.
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <CustomizeWorkspace settings={settings} />
        </Suspense>
      )}
    </div>
  );
}

function CustomizeWorkspace({ settings }: { settings: StorefrontSettings }) {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  // ?section= deep-links the rail — the retired /ecommerce/navigation route
  // redirects here pointing at its section.
  const sectionParam = useSearchParams().get("section");
  const [section, setSection] = useState<SectionId>(() =>
    SECTIONS.some((s) => s.id === sectionParam)
      ? (sectionParam as SectionId)
      : "theme",
  );

  // Preview-relevant draft lifted here so both sections feed the ONE live
  // preview on the right.
  const t = settings.theme ?? {};
  const presetDefaults = getPreset(t.preset);
  const [brandColor, setBrandColor] = useState(
    t.brandColor ?? presetDefaults.brandColor,
  );
  const [accentColor, setAccentColor] = useState(
    t.accentColor ?? presetDefaults.accentColor,
  );
  const [homeTemplate, setHomeTemplate] = useState(
    settings.templates?.home ?? "classic",
  );
  const [heroSrc, setHeroSrc] = useState(settings.templates?.hero ?? "slides");
  const [footerTemplate, setFooterTemplate] = useState(
    settings.templates?.footer ?? "columns",
  );
  const [headerTemplate, setHeaderTemplate] = useState(
    settings.templates?.header ?? "classic",
  );
  const [cardStyle, setCardStyle] = useState(
    settings.templates?.productCard ?? "standard",
  );
  // Three fixed slots seeded by index — an empty slot keeps its default badge.
  const [badges, setBadges] = useState<StorefrontTrustBadge[]>(() =>
    DEFAULT_BADGES.map((d, i) => ({
      text: settings.trustBadges?.[i]?.text ?? "",
      icon: settings.trustBadges?.[i]?.icon ?? d.icon,
    })),
  );
  const [heroSlides, setHeroSlides] = useState<StorefrontHeroSlide[]>(
    () => settings.heroSlides ?? [],
  );
  // Edit-in-place panels: each takes over the left rail (preview stays live).
  const [slidesPanelOpen, setSlidesPanelOpen] = useState(false);
  const [collectionsPanelOpen, setCollectionsPanelOpen] = useState(false);

  // Navigation draft (preview-relevant half — the section owns footer/announcement).
  const [headerMenuSrc, setHeaderMenuSrc] = useState<HeaderMenuSource>(() =>
    resolveHeaderMenu(settings.templates, (settings.nav?.header ?? []).length > 0),
  );
  const [navHeader, setNavHeader] = useState<StorefrontMenuItem[]>(
    () => settings.nav?.header ?? [],
  );

  // Collections are Category docs, not settings — fetched here so the draft can
  // feed the header-menu summary, the panel, and the preview from one place.
  const { data: fetchedCollections } = useStorefrontCollections();
  const [collections, setCollections] = useState<CollectionRowValue[] | null>(null);
  useEffect(() => {
    if (fetchedCollections) setCollections(fetchedCollections.map(toRowValue));
  }, [fetchedCollections]);
  const collectionsDraft = collections ?? [];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* LEFT — fixed-height sticky rail (matches the preview column): content
          scrolls INSIDE it and each mode fills the same frame, so the slides
          panel takeover never changes the column height (no layout blink). */}
      <div className="flex flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-8.75rem)]">
      {slidesPanelOpen ? (
        <HeroSlidesPanel
          slides={heroSlides}
          setSlides={setHeroSlides}
          onClose={() => setSlidesPanelOpen(false)}
        />
      ) : collectionsPanelOpen ? (
        <CollectionsPanel
          collections={collectionsDraft}
          setCollections={setCollections}
          onClose={() => setCollectionsPanelOpen(false)}
        />
      ) : (
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="flex flex-none gap-1 rounded-lg border bg-muted/40 p-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                section === s.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === "theme" ? (
          <ThemeSection
            settings={settings}
            brandColor={brandColor}
            accentColor={accentColor}
            setBrandColor={setBrandColor}
            setAccentColor={setAccentColor}
            badges={badges}
            setBadges={setBadges}
            heroSlides={heroSlides}
            onManageSlides={() => setSlidesPanelOpen(true)}
          />
        ) : section === "templates" ? (
          <TemplatesSection
            settings={settings}
            setHomeTemplate={setHomeTemplate}
            setFooterTemplate={setFooterTemplate}
            setHeaderTemplate={setHeaderTemplate}
            setCardStyle={setCardStyle}
            setHeroSrc={setHeroSrc}
            slideCount={heroSlides.filter((s) => s.title.trim()).length}
            onEditSlides={() => setSlidesPanelOpen(true)}
          />
        ) : (
          <NavigationSection
            settings={settings}
            source={headerMenuSrc}
            setSource={setHeaderMenuSrc}
            header={navHeader}
            setHeader={setNavHeader}
            collections={collectionsDraft}
            onManageCollections={() => setCollectionsPanelOpen(true)}
          />
        )}
      </div>
      )}
      </div>

      {/* RIGHT — live preview (the REAL storefront in preview mode) */}
      <div className="lg:sticky lg:top-6">
        <BrowserPreview
          slug={slug}
          brandColor={brandColor}
          accentColor={accentColor}
          homeTemplate={homeTemplate}
          footerTemplate={footerTemplate}
          headerTemplate={headerTemplate}
          cardStyle={cardStyle}
          badges={badges}
          heroSlides={heroSlides}
          // While editing slides, always preview the carousel so edits are
          // visible even if the hero-source switch is on "banner".
          heroSrc={slidesPanelOpen ? "slides" : heroSrc}
          // Likewise, while managing collections force the collections header so
          // reordering is visible even if the source is set to a custom menu.
          headerMenuSrc={collectionsPanelOpen ? "collections" : headerMenuSrc}
          navHeader={navHeader}
          collections={collectionsDraft}
        />
      </div>
    </div>
  );
}

/* --------------------------------- Theme ---------------------------------- */

function ThemeSection({
  settings,
  brandColor,
  accentColor,
  setBrandColor,
  setAccentColor,
  badges,
  setBadges,
  heroSlides,
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
  onManageSlides: () => void;
}) {
  const save = useUpdateStorefrontSettings();
  const media = useUpdateStorefrontMedia();
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const t = settings.theme ?? {};
  const [preset, setPreset] = useState(t.preset ?? "default");
  const [footerText, setFooterText] = useState(t.footerText ?? "");

  const pickPreset = (id: string) => {
    setPreset(id);
    const def = getPreset(id);
    setBrandColor(def.brandColor);
    setAccentColor(def.accentColor);
  };

  const setBadge = (i: number, patch: Partial<StorefrontTrustBadge>) =>
    setBadges(badges.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const submit = () => {
    save.mutate({
      theme: {
        preset,
        brandColor,
        accentColor,
        footerText: footerText.trim() || undefined,
      },
      // Keep all three slots (empty = default) so positions survive a reload.
      // (Hero slides save from their own panel, not here.)
      trustBadges: badges.map((b) => ({ text: b.text.trim(), icon: b.icon })),
    });
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-5 lg:overflow-y-auto lg:pr-1">
      {/* Preset */}
      <Card className="p-5 shadow-none">
        <h3 className="mb-1 text-sm font-semibold">Preset</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          A one-click baseline. You can still fine-tune colors below.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => pickPreset(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                preset === p.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "hover:bg-muted/50",
              )}
            >
              <span className="flex">
                <span
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: p.brandColor }}
                />
                <span
                  className="-ml-1.5 h-5 w-5 rounded-full border"
                  style={{ backgroundColor: p.accentColor }}
                />
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Branding */}
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Branding</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField
            label="Brand color"
            value={brandColor}
            onChange={setBrandColor}
          />
          <ColorField
            label="Accent color"
            value={accentColor}
            onChange={setAccentColor}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Footer text</Label>
          <Input
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            maxLength={280}
            placeholder="© Your store. All rights reserved."
          />
        </div>
      </Card>

      {/* Logo + banner */}
      <Card className="space-y-4 p-5 shadow-none">
        <h3 className="text-sm font-semibold">Logo &amp; banner</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MediaField
            label="Logo"
            url={settings.logo?.thumbnailUrl || settings.logo?.url}
            inputRef={logoInput}
            disabled={media.isPending}
            onPick={(file) => uploadMedia("logo", file)}
            onRemove={settings.logo ? () => removeMedia("logo") : undefined}
          />
          <MediaField
            label="Banner"
            url={settings.banner?.mediumUrl || settings.banner?.url}
            inputRef={bannerInput}
            disabled={media.isPending}
            onPick={(file) => uploadMedia("banner", file)}
            onRemove={settings.banner ? () => removeMedia("banner") : undefined}
            hint="Hero image when the home page shows the static banner (Templates → Home page); always the preview image for shared store links."
          />
        </div>
      </Card>

      {/* Hero slides — summary only; editing happens in the takeover panel. */}
      <Card className="space-y-3 p-5 shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Hero slides</h3>
            <p className="text-xs text-muted-foreground">
              {heroSlides.length === 0
                ? "No slides yet — the home page shows the standard hero."
                : `${heroSlides.length} ${heroSlides.length === 1 ? "slide" : "slides"} rotating on your home page.`}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onManageSlides}>
            Manage slides
          </Button>
        </div>
        {heroSlides.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {heroSlides.map((s, i) => (
              <SlideThumb key={i} slide={s} className="h-9 w-14" />
            ))}
          </div>
        )}
      </Card>

      {/* Trust badges (Rich footer) */}
      <Card className="space-y-4 p-5 shadow-none">
        <div>
          <h3 className="text-sm font-semibold">
            Trust badges
          </h3>
          <p className="text-xs text-muted-foreground">
            The service highlights shown in the <span className="font-medium">Rich</span> footer.
            Leave a row empty to keep the default text.
          </p>
        </div>
        <div className="space-y-3">
          {badges.map((b, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex flex-wrap gap-1.5">
                {BADGE_ICON_CHOICES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setBadge(i, { icon: name })}
                    aria-label={name}
                    className={cn(
                      "flex items-center justify-center rounded-md border p-1.5 transition-colors",
                      b.icon === name
                        ? "border-primary text-primary ring-2 ring-primary/30"
                        : "text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <SfIcon name={name} size={16} />
                  </button>
                ))}
              </div>
              <Input
                value={b.text}
                onChange={(e) => setBadge(i, { text: e.target.value })}
                placeholder={BADGE_PLACEHOLDERS[i] ?? "Badge text"}
                maxLength={40}
              />
            </div>
          ))}
        </div>
      </Card>

      </div>

      <div className="flex flex-none justify-end">
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save theme"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Templates -------------------------------- */

const TEMPLATE_PAGES: {
  key: keyof NonNullable<StorefrontSettings["templates"]>;
  label: string;
  desc: string;
  options: Option[];
}[] = [
    {
      key: "home",
      label: "Home page",
      desc: "Landing layout",
      options: [
        { value: "classic", label: "Classic" },
        { value: "hero-split", label: "Hero Split" },
        { value: "minimal", label: "Minimal" },
      ],
    },
    {
      key: "collection",
      label: "Collection page",
      desc: "Category / product listing",
      options: [
        { value: "grid-3", label: "Grid 3-col" },
        { value: "grid-4", label: "Grid 4-col" },
        { value: "sidebar", label: "Sidebar filters" },
      ],
    },
    {
      key: "product",
      label: "Product page",
      desc: "Single product layout",
      options: [
        { value: "gallery-left", label: "Gallery left" },
        { value: "gallery-top", label: "Gallery top" },
        { value: "sticky-bar", label: "Sticky buy bar" },
      ],
    },
    {
      key: "productCard",
      label: "Product card",
      desc: "Card style across every listing",
      options: [
        { value: "standard", label: "Standard" },
        { value: "compact", label: "Compact" },
        { value: "bold", label: "Bold CTA" },
      ],
    },
    {
      key: "cart",
      label: "Cart",
      desc: "Cart layout",
      options: [
        { value: "two-column", label: "Two column" },
        { value: "drawer", label: "Slide-over drawer" },
      ],
    },
    {
      key: "checkout",
      label: "Checkout",
      desc: "Checkout flow",
      options: [
        { value: "single-page", label: "Single page" },
        { value: "multi-step", label: "Multi-step" },
      ],
    },
    {
      key: "search",
      label: "Search results",
      desc: "Search layout",
      options: [
        { value: "grid", label: "Grid" },
        { value: "list", label: "List" },
      ],
    },
    {
      key: "header",
      label: "Header",
      desc: "Site-wide header layout",
      options: [
        { value: "classic", label: "Classic" },
        { value: "minimal", label: "Minimal" },
        { value: "centered", label: "Centered" },
      ],
    },
    {
      key: "footer",
      label: "Footer",
      desc: "Site-wide footer layout",
      options: [
        { value: "columns", label: "Columns" },
        { value: "simple", label: "Simple" },
        { value: "rich", label: "Rich" },
      ],
    },
  ];

function TemplatesSection({
  settings,
  setHomeTemplate,
  setFooterTemplate,
  setHeaderTemplate,
  setCardStyle,
  setHeroSrc,
  slideCount,
  onEditSlides,
}: {
  settings: StorefrontSettings;
  setHomeTemplate: (v: string) => void;
  setFooterTemplate: (v: string) => void;
  setHeaderTemplate: (v: string) => void;
  setCardStyle: (v: string) => void;
  setHeroSrc: (v: string) => void;
  slideCount: number;
  onEditSlides: () => void;
}) {
  const save = useUpdateStorefrontSettings();
  const [tpl, setTpl] = useState<Record<string, string>>(() => {
    const t = settings.templates ?? {};
    // Seed from the saved object so keys this section doesn't edit (e.g. the
    // Navigation section's `headerMenu`) survive: the settings PATCH replaces
    // `templates` wholesale, so anything missing here would be wiped on save.
    const seed: Record<string, string> = { ...(t as Record<string, string>) };
    for (const p of TEMPLATE_PAGES) {
      seed[p.key] = (t as Record<string, string>)[p.key] || p.options[0].value;
    }
    seed.hero = t.hero || "slides";
    return seed;
  });

  const pick = (key: string, value: string) => {
    setTpl((s) => ({ ...s, [key]: value }));
    if (key === "home") setHomeTemplate(value);
    if (key === "footer") setFooterTemplate(value);
    if (key === "header") setHeaderTemplate(value);
    if (key === "productCard") setCardStyle(value);
    if (key === "hero") setHeroSrc(value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-5 lg:overflow-y-auto lg:pr-1">
      <HomeTemplateBlock
        layout={tpl.home}
        onLayoutChange={(v) => pick("home", v)}
        heroSource={tpl.hero}
        onHeroSourceChange={(v) => pick("hero", v)}
        slideCount={slideCount}
        onEditSlides={onEditSlides}
      />
      {TEMPLATE_PAGES.filter((p) => p.key !== "home").map((p) => (
        <Card key={p.key} className="space-y-3 p-5 shadow-none">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              {p.label}
            </h3>
            <p className="text-xs text-muted-foreground">{p.desc}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.options.map((o) => {
              const active = tpl[p.key] === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => pick(p.key, o.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-primary ring-2 ring-primary/30"
                      : "hover:bg-muted/50",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Card>
      ))}
      </div>
      <div className="flex flex-none justify-end">
        <Button onClick={() => save.mutate({ templates: tpl })} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save templates"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- live preview ------------------------------ */

/**
 * Renders the REAL storefront home in an iframe (`?preview=1`) inside a faux
 * browser window (traffic-light dots + URL bar + desktop/mobile toggle), and
 * streams the unsaved draft (brand/accent + home template) into it via
 * postMessage. The storefront shell + home read those from the preview store, so
 * edits repaint instantly — no reload. Mobile mode narrows the iframe so its
 * responsive layout flips to the phone view.
 */
function BrowserPreview({
  slug,
  brandColor,
  accentColor,
  homeTemplate,
  footerTemplate,
  headerTemplate,
  cardStyle,
  badges,
  heroSlides,
  heroSrc,
  headerMenuSrc,
  navHeader,
  collections,
}: {
  slug?: string;
  brandColor: string;
  accentColor: string;
  homeTemplate: string;
  footerTemplate: string;
  headerTemplate: string;
  cardStyle: string;
  badges: StorefrontTrustBadge[];
  heroSlides: StorefrontHeroSlide[];
  heroSrc: string;
  headerMenuSrc: HeaderMenuSource;
  navHeader: StorefrontMenuItem[];
  collections: CollectionRowValue[];
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  const url = slug ? `${storefrontUrl(slug)}?preview=1` : "";
  const displayUrl = url.replace(/^https?:\/\//, "");

  // Serialize arrays so the callback identity only changes on real edits.
  const badgesKey = JSON.stringify(badges);
  // Only preview saveable slides (title required), like the save path.
  const slidesKey = JSON.stringify(heroSlides.filter((s) => s.title.trim()));
  const navHeaderKey = JSON.stringify(navHeader.filter((m) => m.label.trim()));
  // Mirror the public GET /:slug/categories contract exactly — listed only,
  // display name wins, draft order preserved — so the preview can't drift from
  // what shoppers will actually get.
  const collectionsKey = JSON.stringify(
    collections
      .filter((c) => c.isListed)
      .map((c) => ({
        _id: c._id,
        name: c.displayName.trim() || c.name,
        slug: c.slug,
      })),
  );

  const post = useCallback(() => {
    ref.current?.contentWindow?.postMessage(
      {
        type: "ezycore-preview",
        payload: {
          theme: { brandColor, accentColor },
          templates: {
            home: homeTemplate,
            footer: footerTemplate,
            header: headerTemplate,
            productCard: cardStyle,
            hero: heroSrc,
            headerMenu: headerMenuSrc,
          },
          trustBadges: JSON.parse(badgesKey),
          heroSlides: JSON.parse(slidesKey),
          nav: { header: JSON.parse(navHeaderKey) },
          collections: JSON.parse(collectionsKey),
        },
      },
      "*",
    );
  }, [brandColor, accentColor, homeTemplate, footerTemplate, headerTemplate, cardStyle, heroSrc, headerMenuSrc, badgesKey, slidesKey, navHeaderKey, collectionsKey]);

  // Push the draft whenever it changes…
  useEffect(() => {
    post();
  }, [post]);

  // …and whenever the storefront (re)loads and announces it's ready.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "ezycore-preview-ready") post();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post]);

  if (!slug) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
        Store URL unavailable.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2">
        <div className="flex flex-none items-center gap-1.5 pl-1">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 flex-none" />
          <span className="truncate">{displayUrl}</span>
        </div>
        <div className="flex flex-none items-center gap-1">
          <div className="flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop view"
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "desktop"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-label="Mobile view"
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "mobile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Reload preview"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in new tab"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Viewport — switching device only resizes the same iframe (no reload) */}
      <div
        className="flex justify-center overflow-auto bg-muted/20"
        style={{ height: "calc(100vh - 11rem)", minHeight: 560 }}
      >
        <div
          className={cn(
            "flex-none overflow-hidden bg-white",
            device === "mobile"
              ? "my-5 h-[calc(100%-2.5rem)] w-[390px] rounded-[2.2rem] border-[10px] border-neutral-800 shadow-2xl"
              : "h-full w-full",
          )}
        >
          <iframe
            key={reloadKey}
            ref={ref}
            src={url}
            title="Storefront preview"
            onLoad={post}
            className="h-full w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 flex-none rounded border"
          aria-label={`${label} swatch`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function MediaField({
  label,
  url,
  inputRef,
  disabled,
  onPick,
  onRemove,
  hint,
}: {
  label: string;
  url?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onPick: (file: File) => void;
  onRemove?: () => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">
            No {label.toLowerCase()}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Upload
        </Button>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onRemove}
            className="text-red-600"
          >
            Remove
          </Button>
        )}
      </div>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
