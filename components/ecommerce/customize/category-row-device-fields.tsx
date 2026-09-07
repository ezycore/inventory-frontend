"use client";
// coding-standard: maintained

import {
  CARD_FLOWS,
  CARD_PER_ROW,
  CARD_SIDES,
  CARD_SPLITS,
  MAX_CARD_HEIGHT,
  MIN_CARD_HEIGHT,
  type BannerLayout,
  type SectionCardDevice,
  type SectionCardShape,
  type SectionCardSide,
} from "@/lib/storefront-sections";
import { NumberField } from "@/ui/components/number-field";
import { Switch } from "@/ui/components/switch";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { cn } from "@/ui/lib/utils";

/** The four settings that belong to ONE screen. */
export function DeviceFields({
  device,
  layout,
  onPatch,
}: {
  device: SectionCardDevice;
  layout: BannerLayout;
  onPatch: (next: Partial<BannerLayout>) => void;
}) {
  const phone = device === "mobile";
  return (
    <>
      {/* ⚠ **Asked before the card's own shape**, because it decides how much
          room a card gets and every setting below is about filling that room.
          A merchant who wants four collections on a phone needs a track, not a
          different picture ratio. */}
      <div className="space-y-1">
        <span className="block text-[11px] text-muted-foreground">Row style</span>
        <div className="grid grid-cols-2 gap-1">
          {CARD_FLOWS.map((f) => (
            <Chip
              key={f}
              group="Row style"
              label={f === "wrap" ? "Fit the row" : "Side-scroll"}
              selected={layout.flow === f}
              onSelect={() => onPatch({ flow: f })}
            />
          ))}
        </div>
        <PartHint>
          {layout.flow === "scroll"
            ? phone
              ? "Cards run off the edge and the shopper swipes — the whole collection in one row."
              : "Cards run off the edge with arrows to page through them."
            : "The cards divide the row and that is the whole row."}
        </PartHint>
      </div>

      <div className="space-y-1">
        <span className="block text-[11px] text-muted-foreground">
          {layout.flow === "scroll" ? "Cards visible" : "Cards per row"}
        </span>
        <div className="grid grid-cols-5 gap-1">
          <Chip
            group="Cards per row"
            label="Auto"
            selected={layout.perRow === undefined}
            onSelect={() => onPatch({ perRow: undefined })}
          />
          {CARD_PER_ROW.map((n) => (
            <Chip
              key={n}
              group="Cards per row"
              label={String(n)}
              selected={layout.perRow === n}
              onSelect={() => onPatch({ perRow: n })}
            />
          ))}
        </div>
        <PartHint>
          {layout.perRow
            ? layout.flow === "scroll"
              ? `${layout.perRow} at a time, the rest a swipe away.`
              : `${layout.perRow} across.`
            : phone
              ? "One card fills the width."
              : "However many collections you picked divide the row."}
        </PartHint>
      </div>

      <div className="space-y-1">
        <span className="block text-[11px] text-muted-foreground">Card shape</span>
        <div className="grid grid-cols-2 gap-1">
          {CARD_SHAPES.map((option) => (
            <Chip
              key={option.value}
              group="Card shape"
              label={option.label}
              selected={layout.shape === option.value}
              onSelect={() => onPatch({ shape: option.value })}
            />
          ))}
        </div>
        <PartHint>
          {layout.shape === "split"
            ? phone
              ? "The picture sits beside the words as a thumbnail, so each card is short."
              : "The picture sits beside the words, two columns across the card."
            : phone
              ? "The picture runs full width above the words. One card fills most of the screen."
              : "The picture runs full width above the words."}
        </PartHint>
      </div>

      {/* Both only mean something once the picture is BESIDE the words — a
          stacked card has no side to sit on and no column to widen. Hidden
          rather than disabled: a dead control is worse than an absent one. */}
      {layout.shape === "split" ? (
        <>
          <div className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">
              Picture side
            </span>
            <div className="grid grid-cols-3 gap-1">
              {CARD_SIDES.map((side) => (
                <Chip
                  key={side}
                  group="Picture side"
                  label={SIDE_LABELS[side]}
                  selected={layout.side === side}
                  onSelect={() => onPatch({ side: side as SectionCardSide })}
                />
              ))}
            </div>
            {layout.side === "alternate" ? (
              <PartHint>
                Picture left, then right, then left down the block.
              </PartHint>
            ) : null}
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">
              Picture width
            </span>
            <div className="grid grid-cols-3 gap-1">
              <Chip
                group="Picture width"
                label="Auto"
                selected={layout.split === undefined}
                onSelect={() => onPatch({ split: undefined })}
              />
              {CARD_SPLITS.map((pct) => (
                <Chip
                  key={pct}
                  group="Picture width"
                  label={`${pct}%`}
                  selected={layout.split === pct}
                  onSelect={() => onPatch({ split: pct })}
                />
              ))}
            </div>
            {/* The Phone tab shows the INHERITED width as the selected chip,
                not "Auto" — `resolveBannerLayout` has already applied the
                desktop's answer, so what a merchant sees selected is what their
                phone actually draws. That is why there is no "same as desktop"
                wording to write here: the selection is the statement. */}
            <PartHint>
              {layout.split
                ? `The picture takes ${layout.split}% of the card and the words take the rest.`
                : phone
                  ? "The picture stays a thumbnail down the side."
                  : "The words take a little more room than the picture."}
            </PartHint>
          </div>
        </>
      ) : null}

      {/* ⚠ **A shape cannot say "20px".** A ratio ties the picture's height to
          the card's WIDTH, and the width is decided by how many collections the
          merchant picked — so a thin strip across the page was not expressible
          at all: even 16:9 leaves a two-up row ~330px of picture. This is the
          escape hatch, and it wins over the shape rather than combining with it.

          ⚠ **Per screen, unlike the shape.** A pixel height is the one setting
          with no relative meaning at all — 200px is a thin band across a 1400px
          desktop and a third of a 700px phone — so sharing it was one control
          quietly doing two different things. */}
      <div className="space-y-1">
        <label className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">Card height</span>
          <div className="flex items-center gap-1">
            <NumberField
              size="sm"
              className="h-7 w-20 text-xs"
              value={layout.height ?? null}
              min={MIN_CARD_HEIGHT}
              max={MAX_CARD_HEIGHT}
              precision={0}
              placeholder="Auto"
              aria-label={`Card height in pixels on ${phone ? "phones" : "desktop"}`}
              onChange={(n) => onPatch({ height: n ?? undefined })}
            />
            <span className="text-[11px] text-muted-foreground">px</span>
          </div>
        </label>
        <PartHint>
          {layout.height
            ? `The picture is ${layout.height}px tall, whatever shape is picked.`
            : "Empty means the picture follows the shape below. Set a height for a short strip the shapes cannot make."}
        </PartHint>
      </div>

      <label className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">Hide the words</span>
        <Switch
          checked={layout.hideText}
          onCheckedChange={(on) => onPatch({ hideText: on })}
          aria-label="Hide the words and let the picture fill the card"
        />
      </label>
      {layout.hideText ? (
        <PartHint>
          The picture fills the card. The collection name still reaches screen
          readers, and the card is still a link.
        </PartHint>
      ) : null}
    </>
  );
}

/**
 * The two card compositions, in the order a merchant meets them: what they
 * already have, then the alternative.
 *
 * **Named by where the picture goes, not by a layout word.** "Stacked" and
 * "split" are how the code says it; a merchant reading a panel wants to know
 * what will move.
 */
const CARD_SHAPES: { value: SectionCardShape; label: string }[] = [
  { value: "stacked", label: "Photo on top" },
  { value: "split", label: "Photo beside" },
];

/** Said as a position, because that is what a merchant is choosing. */
const SIDE_LABELS: Record<SectionCardSide, string> = {
  left: "Left",
  right: "Right",
  alternate: "Alternate",
};

/**
 * One choice. Small enough for five across the rail.
 *
 * ⚠ **The accessible name is qualified by its group, and it has to be.** Two of
 * these rows offer a chip called "Auto" — the picture's shape and the picture's
 * width — so on the label alone a screen reader announces the same word for two
 * unrelated settings and neither can be told from the other. Same failure the
 * card picture's Upload and Remove buttons hit when a single `<label>` wrapped
 * both, and caught the same way: a test could not say which one it meant.
 */
export function Chip({
  group,
  label,
  selected,
  onSelect,
}: {
  /** The setting this chip belongs to, e.g. "Picture width". */
  group: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${group}: ${label}`}
      onClick={onSelect}
      className={cn(
        "h-7 rounded-md border px-1 text-[11px]",
        selected
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
