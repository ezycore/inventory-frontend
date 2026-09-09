// coding-standard: maintained

/**
 * The gallery's order, as the backend wants to hear it.
 *
 * A gallery in the editor is a mixed array — image objects already stored on
 * the product, and `File`s the merchant just picked — and its ORDER is the
 * merchant's intent. The server cannot infer that intent: on update it discards
 * the client's `images` and rebuilds the array itself, which is why replacing
 * the third picture used to leave the replacement stranded at the end.
 *
 * `imageOrder` is the manifest that carries the intent across: one token per
 * slot, a `publicId` for an image that is staying, `upload:<n>` for the n-th
 * file in the same request's `images`. The backend resolver is
 * `src/utils/image-order.ts` in inventory-backend; the token grammar is a
 * cross-repo contract, so change both or neither.
 */

/** Anything already uploaded carries a publicId; a new pick is a `File`. */
export interface StoredImageLike {
  publicId?: string;
}

export type GalleryEntry = File | StoredImageLike;

/**
 * Build the manifest for a gallery, in the order the merchant arranged it.
 *
 * The `upload:<n>` index counts **files only**, in the order they are appended
 * to the FormData — so the caller must append its `File`s in gallery order, and
 * both call sites do it from this same array to guarantee that.
 *
 * Returns `undefined` when there is nothing worth saying: an empty gallery, or
 * one whose stored images carry no `publicId` (an unsaved draft). Sending no
 * manifest is a valid, meaningful request — it means "append", the historical
 * behaviour — so an absent return is a normal outcome, not a failure.
 */
export const buildImageOrder = (
  entries: readonly GalleryEntry[],
): string[] | undefined => {
  if (!entries.length) return undefined;

  let uploadIndex = 0;
  const tokens: string[] = [];

  for (const entry of entries) {
    if (entry instanceof File) {
      tokens.push(`upload:${uploadIndex}`);
      uploadIndex += 1;
      continue;
    }
    // A stored image with no publicId cannot be named, so the manifest would be
    // a lie about which slot it holds. Drop the whole thing rather than send a
    // partial order the server would resolve into a different gallery.
    if (!entry?.publicId) return undefined;
    tokens.push(entry.publicId);
  }

  return tokens;
};

/**
 * Swap the picture in one slot, keeping its position.
 *
 * The thing merchants actually ask for, and the reason the manifest exists.
 * Doing it as delete-then-add appends the replacement to the end and makes the
 * merchant walk it back up the list; doing it here keeps the slot, and
 * `buildImageOrder` then names that slot for the server.
 *
 * The old entry is simply dropped from the array. When it was a stored image
 * its `publicId` stops appearing in the gallery, which is exactly how the
 * submit helpers already detect a removal — so the delete is expressed without
 * a second mechanism.
 */
export const replaceGalleryEntry = <T,>(
  entries: readonly T[],
  at: number,
  replacement: T,
): T[] => {
  if (at < 0 || at >= entries.length) return [...entries];
  const next = [...entries];
  next[at] = replacement;
  return next;
};

/** New picks, in gallery order — the order `upload:<n>` indexes into. */
export const galleryFiles = (entries: readonly GalleryEntry[]): File[] =>
  entries.filter((entry): entry is File => entry instanceof File);

/**
 * Move one gallery entry to another position, returning a new array.
 *
 * Out-of-range targets are a no-op rather than an error: the arrow buttons at
 * the ends of the list call this with `-1` / `length` on every render path, and
 * a guard here keeps that decision in one place instead of at each button.
 */
export const moveGalleryEntry = <T,>(
  entries: readonly T[],
  from: number,
  to: number,
): T[] => {
  if (from === to) return [...entries];
  if (from < 0 || from >= entries.length) return [...entries];
  if (to < 0 || to >= entries.length) return [...entries];

  const next = [...entries];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};
