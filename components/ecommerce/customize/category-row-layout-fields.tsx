"use client";
// coding-standard: maintained

import { useState } from "react";

import type { StoreSectionConfig } from "@/lib/storefront-client";
import {
  CARD_FLOWS,
  CARD_PER_ROW,
  CARD_RATIOS,
  CARD_SIDES,
  CARD_SPLITS,
  MAX_CARD_HEIGHT,
  MIN_CARD_HEIGHT,
  mobileCardOverrides,
  resolveBannerLayout,
  resolveCardRadius,
  resolveCardRatio,
  type BannerLayout,
  type SectionCardDevice,
  type SectionCardFlow,
  type SectionCardRatio,
  type SectionCardShape,
  type SectionCardSide,
} from "@/lib/storefront-sections";
import { NumberField } from "@/ui/components/number-field";
import { Switch } from "@/ui/components/switch";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { cn } from "@/ui/lib/utils";
import {
  Chip,
  DeviceFields,
} from "@/components/ecommerce/customize/category-row-device-fields";

/**
 * How a promo card is BUILT — shape, which side the picture sits on, how wide
 * it is, and whether there are words at all.
 *
 * **Split into a Desktop tab and a Phone tab, because half of these do not
 * travel and half of them do.** 65% of a desktop card is a generous picture;
 * 65% of a 390px phone leaves the words in a gutter. So composition is per
 * device, while the picture's own shape and the row's width are asked once —
 * a square photograph is square on a phone, and a setting split across two tabs
 * for no reason is two places a merchant has to look.
 *
 * **The phone inherits until it is told not to.** One switch, not four
 * tri-state controls: "Phones use the desktop layout" is a question a merchant
 * can answer, whereas six chip rows each carrying a hidden "same as desktop"
 * value is a puzzle. Turning it off seeds the phone's answers from the desktop's
 * so the first thing they see is what they already had.
 *
 * Lives beside `CategoryRowConfig` rather than inside it: that panel is the
 * collections and their copy, this is the look, and together they were well past
 * the component ceiling.
 */
export function CategoryRowLayoutFields({
  config,
  onChange,
}: {
  config: StoreSectionConfig | undefined;
  onChange: (patch: Partial<StoreSectionConfig>) => void;
}) {
  const [device, setDevice] = useState<SectionCardDevice>("desktop");
  const layout = resolveBannerLayout(config);
  const ratio = resolveCardRatio(config);
  const radius = resolveCardRadius(config);
  const scrolls =
    layout.desktop.flow === "scroll" || layout.mobile.flow === "scroll";
  /* A phone with its own answers. The presence of the block IS the switch —
     there is no separate boolean to fall out of step with it. */
  const phoneCustom = !!config?.mobile;
  const shown = device === "desktop" ? layout.desktop : layout.mobile;
  const editing = device === "mobile" && !phoneCustom ? null : shown;

  /**
   * Desktop writes the row's own fields; the phone writes its override block.
   *
   * ⚠ **The desktop half DROPS a value that is already the default** — stacked,
   * left, words shown — rather than storing it. "Has never been asked" has to
   * stay distinguishable from "was asked and chose the thing that was already
   * there", because the first follows any future change to what the default
   * means and the second is frozen. It is also what lets a row whose only
   * setting was the shape disappear entirely when the shape goes back.
   *
   * ⚠ **The phone half stores every value explicitly, defaults included**, and
   * that asymmetry is deliberate: on the phone the presence of the block IS the
   * "has its own answers" signal, so dropping a default there would hand the
   * field back to the desktop and un-answer a question the merchant just
   * answered. Empty blocks are still stripped, so opening the tab and changing
   * nothing stores nothing.
   */
  const patch = (next: Partial<BannerLayout>) => {
    if (device === "desktop") {
      return onChange({
        ...(next.shape !== undefined
          ? { cardShape: next.shape === "stacked" ? undefined : next.shape }
          : null),
        ...(next.side !== undefined
          ? { cardSide: next.side === "left" ? undefined : next.side }
          : null),
        ...("split" in next ? { cardSplit: next.split } : null),
        ...(next.hideText !== undefined
          ? { cardHideText: next.hideText || undefined }
          : null),
        ...("height" in next ? { cardHeight: next.height } : null),
        ...(next.flow !== undefined
          ? { cardFlow: next.flow === "wrap" ? undefined : next.flow }
          : null),
        ...("perRow" in next ? { cardPerRow: next.perRow } : null),
      });
    }
    onChange({
      mobile: mobileCardOverrides({
        ...config?.mobile,
        ...(next.shape !== undefined ? { cardShape: next.shape } : null),
        ...(next.side !== undefined ? { cardSide: next.side } : null),
        ...("split" in next ? { cardSplit: next.split } : null),
        ...(next.hideText !== undefined ? { cardHideText: next.hideText } : null),
        ...("height" in next ? { cardHeight: next.height } : null),
        ...(next.flow !== undefined ? { cardFlow: next.flow } : null),
        ...("perRow" in next ? { cardPerRow: next.perRow } : null),
      }),
    });
  };

  /* Seeded from the desktop rather than from the defaults: a merchant turning
     this off is about to adjust the layout they can already see, and starting
     them somewhere else would read as the panel resetting their row. */
  const takeOverPhone = (own: boolean) =>
    onChange({
      mobile: own
        ? mobileCardOverrides({
            cardShape: layout.desktop.shape,
            cardSide: layout.desktop.side,
            cardSplit: layout.desktop.split,
            cardHideText: layout.desktop.hideText,
            cardHeight: layout.desktop.height,
            cardFlow: layout.desktop.flow,
            cardPerRow: layout.desktop.perRow,
          })
        : undefined,
    });

  return (
    <div className="space-y-2 border-t pt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">Card layout</span>
        <div className="flex gap-1">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={device === d}
              onClick={() => setDevice(d)}
              className={cn(
                "h-6 rounded-md border px-2 text-[11px]",
                device === d
                  ? "border-primary bg-primary/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {d === "desktop" ? "Desktop" : "Phone"}
            </button>
          ))}
        </div>
      </div>

      {device === "mobile" ? (
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Phones use the desktop layout
          </span>
          <Switch
            checked={!phoneCustom}
            onCheckedChange={(on) => takeOverPhone(!on)}
            aria-label="Phones use the desktop layout"
          />
        </label>
      ) : null}

      {editing ? (
        <DeviceFields
          device={device}
          layout={editing}
          onPatch={patch}
        />
      ) : (
        <PartHint>
          Your phone cards follow the Desktop tab. Switch this off to give them
          their own shape, picture side and width.
        </PartHint>
      )}

      {/* ---- Asked once, for both screens ---- */}
      <div className="space-y-1 border-t pt-2">
        <span className="block text-[11px] text-muted-foreground">
          Picture shape
        </span>
        <div className="grid grid-cols-5 gap-1">
          {/* "Automatic" is a real choice and the DEFAULT one, not a null state
              dressed up: the built-in shape differs by card composition AND by
              screen, and only the stylesheet can see a screen. Picking a shape
              here fixes it everywhere, which is what a merchant means by picking
              one — and is why it must be possible to go back. */}
          <Chip
            group="Picture shape"
            label="Auto"
            selected={!ratio}
            onSelect={() => onChange({ cardRatio: undefined })}
          />
          {CARD_RATIOS.map((option) => (
            <Chip
              key={option}
              group="Picture shape"
              label={option}
              selected={ratio === option}
              onSelect={() => onChange({ cardRatio: option as SectionCardRatio })}
            />
          ))}
        </div>
        <PartHint>
          {ratio
            ? "This shape is used on every screen, including phones. A card height, set per screen above, overrides it."
            : "Wide above the words, squarer beside them — and shorter on a phone. Pick a shape to fix it everywhere."}
        </PartHint>
      </div>

      {/* ⚠ **Unset is the right answer for nearly every shop**, and the hint
          says so rather than leaving a merchant to wonder why a number box sits
          empty. Corners are a BRAND decision made once in Design → Corners and
          applied to every card, panel and field in the storefront; this is the
          override for a row that deliberately differs — a photographic band
          with square corners under a shop of rounded cards. */}
      <div className="space-y-1 border-t pt-2">
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">Card corners</span>
          <div className="flex items-center gap-1">
            <NumberField
              size="sm"
              className="h-7 w-20 text-xs"
              value={radius ?? null}
              min={0}
              max={40}
              precision={0}
              placeholder="Theme"
              aria-label="Card corner radius in pixels"
              onChange={(n) => onChange({ cardRadius: n ?? undefined })}
            />
            <span className="text-[11px] text-muted-foreground">px</span>
          </div>
        </label>
        <PartHint>
          {radius === undefined
            ? "Following your shop's corners, set in Design. Type a number to make this row differ."
            : `${radius}px on this row only — the rest of your shop keeps its own corners.`}
        </PartHint>
      </div>

      {/* Only when a screen actually scrolls — arrows over a grid are a control
          for something that cannot happen. */}
      {scrolls ? (
        <div className="space-y-1 border-t pt-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">Scroll arrows</span>
            <Switch
              checked={config?.cardArrows !== false}
              onCheckedChange={(on) =>
                onChange({ cardArrows: on ? undefined : false })
              }
              aria-label="Show paging arrows on the scrolling row"
            />
          </label>
          {/* ⚠ Says where they appear. Arrows are a pointer affordance and the
              storefront only ever draws them on one — a phone swipes the track,
              and two 36px buttons would cover the cards it can show. A merchant
              who switches this on and sees nothing on their phone would read
              that as broken. */}
          <PartHint>
            {config?.cardArrows === false
              ? "No arrows — the row is swiped or dragged."
              : "Shown on computers where the row overflows. Phones swipe instead."}
          </PartHint>
        </div>
      ) : null}

      <div className="space-y-1 border-t pt-2">
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">Full width</span>
          <Switch
            checked={config?.fullWidth === true}
            onCheckedChange={(on) => onChange({ fullWidth: on ? true : undefined })}
            aria-label="Let this row span the window"
          />
        </label>
        <PartHint>
          {config?.fullWidth
            ? "This row spans the window instead of lining up with the rest of the page."
            : "The row lines up with the other sections on the page."}
        </PartHint>
      </div>

      <div className="space-y-1 border-t pt-2">
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">Show button</span>
          <Switch
            checked={config?.showCta !== false}
            onCheckedChange={(on) => onChange({ showCta: on ? undefined : false })}
            aria-label="Show the button on each card"
          />
        </label>
        {/* ⚠ Says the thing a merchant would otherwise have to test: the card
            does not stop being a link. The whole card has always been the
            anchor and the button was only ever the visible half of it, which is
            why this can be a plain switch rather than a "then how do they click
            it" problem. */}
        <PartHint>
          {config?.showCta === false
            ? "The cards still open their collection — the whole card is the link."
            : "Turn this off for picture-only cards. They stay clickable."}
        </PartHint>
      </div>
    </div>
  );
}

