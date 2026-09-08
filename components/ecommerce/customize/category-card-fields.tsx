"use client";
// coding-standard: maintained

import { ImagePlus, Loader2, X } from "lucide-react";

import type { StoreSectionCard } from "@/lib/storefront-client";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { PartHint } from "@/components/ecommerce/customize/part-group";
import { ImageRatioWarning } from "@/components/shared/image-ratio-warning";
import { StoreLinkHint } from "@/components/ecommerce/customize/store-link-hint";

/**
 * One promo card's own words, picture and button.
 *
 * ⚠ **Everything here is an OVERRIDE and nothing here edits the collection.**
 * A merchant typing "Winter cushions, half price" is writing an advertisement
 * for this block; the collection keeps its own name and description for its
 * page, the tile row, the header menu and every other place it appears. An
 * earlier cut of this feature put the same boxes on Catalog → Collections,
 * which meant styling the home page silently rewrote the collection page — the
 * exact thing this shape exists to prevent, and the reason every field below
 * shows the collection's own value as a PLACEHOLDER rather than as a value.
 *
 * That placeholder is the whole interface, really: it is how a merchant sees
 * what the card already says, and it is why leaving a box empty has to mean
 * "keep using that" rather than "print nothing". A blank field is never stored.
 */
export function CategoryCardFields({
  card,
  collectionName,
  collectionDescription,
  hasCollectionImage,
  uploading,
  recommended,
  ratioWarning,
  onChange,
  onPickImage,
  onClearImage,
}: {
  /** The stored overrides, or undefined for a card never written. */
  card: StoreSectionCard | undefined;
  /** What the card shows today — the placeholder under Title. */
  collectionName: string;
  /** The collection's own line, if it has one. Placeholder under Description. */
  collectionDescription: string;
  /** Does the collection have a picture to fall back to? */
  hasCollectionImage: boolean;
  uploading: boolean;
  /**
   * The size this card's picture actually wants, computed from the row's own
   * shape, width and height settings — see `recommendedCardImage`.
   *
   * ⚠ **Not a constant, because there is no single right answer here.** A
   * stacked 16:9 card wants a wide landscape photograph; a split card at 25%
   * wants something a quarter the width and nearly square; a 20px height wants
   * a banner strip. A fixed "600 × 600" would be wrong for most of the
   * combinations the panel offers, and a hint that is usually wrong is worse
   * than no hint — merchants learn to skip it, including the time it mattered.
   */
  recommended: { w: number; h: number };
  /** Set when the picked file's shape is well off `recommended`. */
  ratioWarning: string | null;
  onChange: (patch: Partial<Omit<StoreSectionCard, "categoryId">>) => void;
  onPickImage: () => void;
  onClearImage: () => void;
}) {
  const image = card?.image;
  const imageUrl = image?.thumbnailUrl || image?.mediumUrl || image?.url;

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-2">
      <Field label="Card title">
        <Input
          value={card?.title ?? ""}
          maxLength={60}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={collectionName}
          className="h-7 text-xs"
          aria-label={`Card title for ${collectionName}`}
        />
      </Field>

      <Field label="Card description">
        <Textarea
          value={card?.description ?? ""}
          rows={2}
          maxLength={200}
          onChange={(e) => onChange({ description: e.target.value })}
          /* The collection's own line when it has one, so the merchant can see
             what they are replacing. When it has none the placeholder says what
             the card does WITHOUT one, because an empty box beside an empty
             card is not information. */
          placeholder={
            collectionDescription ||
            "No description — this card shows a name and a button only."
          }
          className="text-xs"
          aria-label={`Card description for ${collectionName}`}
        />
      </Field>

      <FieldGroup label="Card picture">
        <div className="flex items-center gap-2">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-10 w-14 flex-none rounded border object-cover"
            />
          ) : (
            <span className="flex h-10 w-14 flex-none items-center justify-center rounded border border-dashed text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" />
            </span>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={onPickImage}
            className="h-7 rounded-md border px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : image ? (
              "Replace"
            ) : (
              "Upload"
            )}
          </button>
          {image ? (
            <button
              type="button"
              onClick={onClearImage}
              className="flex h-7 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-muted"
              aria-label={`Remove the card picture for ${collectionName}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        {/* ⚠ **Shown before the upload, and it moves with the settings.** The
            recommendation is derived from this row's own shape, picture width
            and height, so changing any of those changes the number here while
            the merchant watches — which is the point: they are told what to
            crop to for the card they are actually building, not for promo cards
            in general. */}
        {/* <PartHint>
          Best at {recommended.w} × {recommended.h}px.
        </PartHint> */}
        <ImageRatioWarning message={ratioWarning} />
        {/* ⚠ Says what removing does. A merchant who uploaded a card picture
            and then removes it has not emptied the card — it goes back to the
            collection's own photograph, and if there is none, to a blank
            panel. Both are worth knowing before pressing the ×. */}
        {image ? (
          <PartHint>
            Used instead of the collection&apos;s picture, here only. Remove it
            to go back to{" "}
            {hasCollectionImage
              ? "the collection's own photo"
              : "a blank panel — this collection has no picture of its own"}
            .
          </PartHint>
        ) : null}
      </FieldGroup>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Button">
          <Input
            value={card?.buttonLabel ?? ""}
            maxLength={40}
            onChange={(e) => onChange({ buttonLabel: e.target.value })}
            /* Not the literal English "Shop now": the built-in label follows
               the shopper's language, and a typed one cannot. Saying so here is
               how a merchant knows that typing is a trade-off. */
            placeholder="Shop now (translated)"
            className="h-7 text-xs"
            aria-label={`Button label for ${collectionName}`}
          />
        </Field>
        <Field label="Links to">
          <Input
            value={card?.buttonHref ?? ""}
            maxLength={300}
            onChange={(e) => onChange({ buttonHref: e.target.value })}
            placeholder="This collection"
            className="h-7 text-xs"
            aria-label={`Link for ${collectionName}`}
          />
        </Field>
      </div>
      {card?.buttonHref?.trim() ? (
        <>
          <PartHint>
            The whole card leads here instead of the collection page. Use a store
            path such as <code>/products?tags=winter</code>, or a full address.
          </PartHint>
          {/* ⚠ The same resolved-destination line every other link field in
              Customize carries, and this one needed it most: the card renders
              its href through `storeLinkHref`, which rewrites a `/shop`-prefixed
              path and refuses a scheme it does not know. Without this the
              merchant only finds out by pressing the card on the live shop. */}
          <StoreLinkHint value={card.buttonHref} />
        </>
      ) : null}
    </div>
  );
}

/** A label over its ONE control, at the rail's own density. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/**
 * A caption over a GROUP of controls — the picture row, which is a thumbnail
 * plus an upload button plus a remove button.
 *
 * ⚠ **Not a `<label>`, and that is the whole reason it exists.** A `<label>`
 * names the control inside it, so wrapping two buttons in one gave both the
 * accessible name "Card picture" — a screen-reader user heard the same word for
 * "upload" and for "remove". Caught by the test that asks for the Upload button
 * by name and could not find it, which is the cheapest kind of a11y bug to find
 * and an invisible one otherwise.
 */
function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
