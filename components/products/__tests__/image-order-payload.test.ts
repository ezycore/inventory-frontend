// coding-standard: maintained
/**
 * The product form's image payload: which files are appended, in what order,
 * and the `imageOrder` manifest that tells the server where each one goes.
 *
 * Tested at the payload rather than the UI because the failure is silent. The
 * save succeeds either way — the merchant just gets their pictures in an order
 * they did not choose, with no error to explain it. The specific trap is that
 * `upload:<n>` indexes the APPENDED FILES, not the gallery slot, so a
 * replacement in slot 3 with another new pick ahead of it is `upload:1`; get
 * that wrong and two images quietly swap places.
 */
import { describe, it, expect } from "vitest";
import { makePrepareSubmitData } from "../helpers";

const t = ((key: string) => key) as never;
const prepare = makePrepareSubmitData(t);

const stored = (publicId: string) => ({
  publicId,
  url: `https://cdn.test/${publicId}.webp`,
});
const pick = (name: string) => new File(["x"], name, { type: "image/png" });

const readOrder = (fd: FormData): string[] | undefined => {
  const raw = fd.get("imageOrder");
  return typeof raw === "string" ? JSON.parse(raw) : undefined;
};
const readRemoved = (fd: FormData): string[] | undefined => {
  const raw = fd.get("removeImages");
  return typeof raw === "string" ? JSON.parse(raw) : undefined;
};
const appendedFileNames = (fd: FormData) =>
  fd.getAll("images").map((f) => (f as File).name);

describe("product image payload", () => {
  it("replaces the third picture in place", () => {
    // Five stored images, the third swapped for a new file. This is the whole
    // feature: without the manifest the server appends and the merchant gets
    // [0, 1, 3, 4, new].
    const item = {
      images: [0, 1, 2, 3, 4].map((i) => stored(`img-${i}`)),
    };
    const gallery = [
      stored("img-0"),
      stored("img-1"),
      pick("replacement.png"),
      stored("img-3"),
      stored("img-4"),
    ];

    const fd = prepare({ name: "Panjabi", images: gallery }, true, item);

    expect(readRemoved(fd)).toEqual(["img-2"]);
    expect(appendedFileNames(fd)).toEqual(["replacement.png"]);
    expect(readOrder(fd)).toEqual([
      "img-0",
      "img-1",
      "upload:0",
      "img-3",
      "img-4",
    ]);
  });

  it("numbers uploads by file order, not slot, when several are new", () => {
    const item = { images: [stored("img-0")] };
    const gallery = [pick("a.png"), stored("img-0"), pick("b.png")];

    const fd = prepare({ name: "Panjabi", images: gallery }, true, item);

    // The order the files are appended IS what `upload:<n>` counts.
    expect(appendedFileNames(fd)).toEqual(["a.png", "b.png"]);
    expect(readOrder(fd)).toEqual(["upload:0", "img-0", "upload:1"]);
    expect(readRemoved(fd)).toBeUndefined();
  });

  it("sends a manifest for a pure reorder, with no files and no removals", () => {
    // Promoting an existing image to primary. Nothing is uploaded and nothing
    // is deleted, so the manifest is the only thing carrying the change.
    const item = { images: [stored("img-0"), stored("img-1")] };
    const gallery = [stored("img-1"), stored("img-0")];

    const fd = prepare({ name: "Panjabi", images: gallery }, true, item);

    expect(appendedFileNames(fd)).toEqual([]);
    expect(readRemoved(fd)).toBeUndefined();
    expect(readOrder(fd)).toEqual(["img-1", "img-0"]);
  });

  it("orders the uploads on create too", () => {
    const fd = prepare(
      { name: "Panjabi", images: [pick("a.png"), pick("b.png")] },
      false,
    );

    expect(appendedFileNames(fd)).toEqual(["a.png", "b.png"]);
    expect(readOrder(fd)).toEqual(["upload:0", "upload:1"]);
  });

  it("sends no manifest when the gallery is empty", () => {
    const fd = prepare({ name: "Panjabi", images: [] }, true, { images: [] });

    expect(readOrder(fd)).toBeUndefined();
  });
});

describe("variant image payload", () => {
  const readVariants = (fd: FormData) => {
    const raw = fd.get("variants");
    return typeof raw === "string" ? JSON.parse(raw) : undefined;
  };
  const variantFileNames = (fd: FormData, idx: number) =>
    fd.getAll(`variantImages_${idx}`).map((f) => (f as File).name);

  const variableProduct = (variants: unknown[]) => ({
    name: "Panjabi",
    productType: "variable",
    variants,
  });

  it("carries a manifest per variant", () => {
    const fd = prepare(
      variableProduct([
        {
          enabled: true,
          attributeName: "Colour",
          value: "Red",
          price: 100,
          images: [stored("v-a"), pick("new.png"), stored("v-b")],
        },
      ]),
      false,
    );

    expect(variantFileNames(fd, 0)).toEqual(["new.png"]);
    expect(readVariants(fd)[0].imageOrder).toEqual([
      "v-a",
      "upload:0",
      "v-b",
    ]);
    // Only the stored ones travel in the JSON; the new pick is a file.
    expect(readVariants(fd)[0].images.map((i: any) => i.publicId)).toEqual([
      "v-a",
      "v-b",
    ]);
  });

  it("numbers each variant's uploads from zero, not across variants", () => {
    // The bug a single-variant test cannot see: one shared counter would make
    // variant 1's `upload:0` point at variant 0's file.
    const fd = prepare(
      variableProduct([
        {
          enabled: true,
          attributeName: "Colour",
          value: "Red",
          price: 100,
          images: [pick("red.png"), stored("v0-a")],
        },
        {
          enabled: true,
          attributeName: "Colour",
          value: "Blue",
          price: 100,
          images: [pick("blue.png"), stored("v1-a")],
        },
      ]),
      false,
    );

    expect(variantFileNames(fd, 0)).toEqual(["red.png"]);
    expect(variantFileNames(fd, 1)).toEqual(["blue.png"]);
    expect(readVariants(fd)[0].imageOrder).toEqual(["upload:0", "v0-a"]);
    expect(readVariants(fd)[1].imageOrder).toEqual(["upload:0", "v1-a"]);
  });

  it("omits the manifest for a variant with no images", () => {
    const fd = prepare(
      variableProduct([
        {
          enabled: true,
          attributeName: "Colour",
          value: "Red",
          price: 100,
          images: [],
        },
      ]),
      false,
    );

    expect(readVariants(fd)[0].imageOrder).toBeUndefined();
  });
});
