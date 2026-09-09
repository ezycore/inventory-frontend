// coding-standard: maintained
import { describe, expect, it } from "vitest";

import {
  buildImageOrder,
  galleryFiles,
  moveGalleryEntry,
  replaceGalleryEntry,
  type GalleryEntry,
} from "@/lib/image-gallery-order";

/**
 * The client half of the position-preserving contract.
 *
 * The token grammar is shared with `inventory-backend/src/utils/image-order.ts`
 * — these tests pin the shapes that file's resolver expects, so a change on
 * either side that is not made on both breaks here rather than in production.
 */
describe("buildImageOrder", () => {
  const stored = (publicId: string) => ({ publicId });
  const pick = (name: string) => new File(["x"], name, { type: "image/png" });

  it("names stored images by publicId and new picks by upload index", () => {
    const gallery = [stored("a"), stored("b"), pick("new.png"), stored("d")];

    expect(buildImageOrder(gallery)).toEqual(["a", "b", "upload:0", "d"]);
  });

  it("numbers uploads by their order among FILES, not their slot", () => {
    // `upload:<n>` indexes the appended files, so a pick in slot 3 with another
    // pick ahead of it is `upload:1` — getting this wrong swaps two images.
    const gallery = [pick("first.png"), stored("a"), pick("second.png")];

    expect(buildImageOrder(gallery)).toEqual(["upload:0", "a", "upload:1"]);
    expect(galleryFiles(gallery).map((f) => f.name)).toEqual([
      "first.png",
      "second.png",
    ]);
  });

  it("describes the replace-the-third-picture case", () => {
    const gallery = [
      stored("img-0"),
      stored("img-1"),
      pick("replacement.png"),
      stored("img-3"),
      stored("img-4"),
    ];

    expect(buildImageOrder(gallery)).toEqual([
      "img-0",
      "img-1",
      "upload:0",
      "img-3",
      "img-4",
    ]);
  });

  it("sends nothing for an empty gallery", () => {
    expect(buildImageOrder([])).toBeUndefined();
  });

  it("sends nothing when a stored image has no publicId", () => {
    // A partial manifest would resolve into a gallery the merchant did not ask
    // for, so the whole thing is dropped and the server falls back to append.
    expect(buildImageOrder([stored("a"), {}, stored("b")])).toBeUndefined();
  });
});

describe("moveGalleryEntry", () => {
  const list = ["a", "b", "c", "d"];

  it("moves an entry later", () => {
    expect(moveGalleryEntry(list, 0, 1)).toEqual(["b", "a", "c", "d"]);
  });

  it("moves an entry earlier — how the cover image is chosen", () => {
    expect(moveGalleryEntry(list, 3, 2)).toEqual(["a", "b", "d", "c"]);
    expect(moveGalleryEntry(list, 2, 0)).toEqual(["c", "a", "b", "d"]);
  });

  it("no-ops past either end instead of throwing", () => {
    expect(moveGalleryEntry(list, 0, -1)).toEqual(list);
    expect(moveGalleryEntry(list, 3, 4)).toEqual(list);
    expect(moveGalleryEntry(list, 1, 1)).toEqual(list);
  });

  it("returns a new array, never the one it was given", () => {
    const result = moveGalleryEntry(list, 0, 1);

    expect(result).not.toBe(list);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });
});

describe("replaceGalleryEntry", () => {
  const stored = (publicId: string) => ({ publicId });
  const pick = (name: string) => new File(["x"], name, { type: "image/png" });

  it("swaps a slot without moving anything else", () => {
    const gallery: GalleryEntry[] = [stored("a"), stored("b"), stored("c")];
    const next = replaceGalleryEntry(gallery, 1, pick("new.png"));

    expect(next[0]).toBe(gallery[0]);
    expect(next[2]).toBe(gallery[2]);
    expect((next[1] as File).name).toBe("new.png");
  });

  it("produces a manifest that keeps the replaced slot", () => {
    // The end-to-end point: a replacement at index 1 is `upload:0` at index 1,
    // so the server rebuilds the gallery with the new picture in that slot.
    const gallery = replaceGalleryEntry<GalleryEntry>(
      [stored("a"), stored("b"), stored("c")],
      1,
      pick("new.png"),
    );

    expect(buildImageOrder(gallery)).toEqual(["a", "upload:0", "c"]);
    // "b" is simply gone from the gallery, which is how the submit helpers
    // already detect a removal — no second mechanism needed.
    expect(galleryFiles(gallery).map((f) => f.name)).toEqual(["new.png"]);
  });

  it("no-ops out of range instead of growing the array", () => {
    const gallery: GalleryEntry[] = [stored("a"), stored("b")];

    expect(replaceGalleryEntry(gallery, -1, pick("x.png"))).toHaveLength(2);
    expect(replaceGalleryEntry(gallery, 2, pick("x.png"))).toHaveLength(2);
  });

  it("does not mutate the array it was given", () => {
    const gallery: GalleryEntry[] = [stored("a"), stored("b")];
    replaceGalleryEntry(gallery, 0, pick("x.png"));

    expect(gallery[0]).toEqual({ publicId: "a" });
  });
});
