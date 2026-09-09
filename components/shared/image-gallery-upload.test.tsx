// coding-standard: maintained

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/tests/test-utils";
import {
  ImageGalleryUpload,
  type GalleryImage,
} from "@/components/shared/image-gallery-upload";

/**
 * The gallery's row controls, at the level a merchant meets them.
 *
 * `buildImageOrder` and `replaceGalleryEntry` are unit-tested separately; what
 * this file pins is the wiring those cannot see — that the controls render at
 * all, that they hand back a NEW array rather than mutating in place, and that
 * the ends of the list are disabled instead of silently doing nothing. A
 * gallery whose buttons look right and emit nothing would pass every other test
 * in the repo.
 *
 * Rendered through `renderWithProviders` because the row reads its labels from
 * `common.gallery` — which is also what makes the aria-label assertions below
 * a check on the message file, not just on the markup.
 */
const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const stored = (publicId: string) => ({
  publicId,
  url: `https://cdn.test/${publicId}.webp`,
  thumbnailUrl: `https://cdn.test/${publicId}-t.webp`,
});

const ids = (images: GalleryImage[]) =>
  images.map((img) => (img instanceof File ? img.name : img.publicId));

describe("ImageGalleryUpload row controls", () => {
  const gallery = [stored("a"), stored("b"), stored("c")];

  beforeEach(() => toastError.mockClear());

  const renderGallery = (value: GalleryImage[] = gallery, maxFiles = 5) => {
    const onChange = vi.fn();
    renderWithProviders(
      <ImageGalleryUpload value={value} onChange={onChange} maxFiles={maxFiles} />,
    );
    return onChange;
  };

  describe("ordering", () => {
    it("marks the first image as primary", () => {
      renderGallery();

      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("moves an image later", () => {
      const onChange = renderGallery();

      fireEvent.click(screen.getByLabelText("Move a later"));

      expect(ids(onChange.mock.calls[0][0])).toEqual(["b", "a", "c"]);
    });

    it("promotes the second image to primary", () => {
      const onChange = renderGallery();

      // The label says what the move means at position 1 — moving to the top is
      // the only way to choose the storefront cover, and nothing else says so.
      fireEvent.click(screen.getByLabelText("Make primary image"));

      expect(ids(onChange.mock.calls[0][0])).toEqual(["b", "a", "c"]);
    });

    it("disables the arrows at the ends of the list", () => {
      renderGallery();

      expect(screen.getByLabelText("Make primary image")).toBeEnabled();
      expect(screen.getByLabelText("Move c later")).toBeDisabled();
    });

    it("shows no ordering controls for a single-image field", () => {
      renderGallery([stored("a")], 1);

      expect(screen.queryByText("Primary")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^Move /)).not.toBeInTheDocument();
    });
  });

  describe("replace", () => {
    const pickInto = (label: string, file: File) => {
      const button = screen.getByLabelText(label);
      const input = button.parentElement?.querySelector<HTMLInputElement>(
        'input[type="file"]',
      );
      if (!input) throw new Error("replace input not found");
      fireEvent.change(input, { target: { files: [file] } });
    };

    it("swaps one slot and leaves the rest alone", () => {
      // The whole point: one click replaces the middle picture, where before it
      // took a delete, an upload, and two clicks of the up arrow.
      const onChange = renderGallery();

      pickInto("Replace b", new File(["x"], "new.png", { type: "image/png" }));

      expect(ids(onChange.mock.calls[0][0])).toEqual(["a", "new.png", "c"]);
    });

    it("offers replace on a single-image field too", () => {
      // Ordering is meaningless with one image; replacing is not.
      renderGallery([stored("a")], 1);

      expect(screen.getByLabelText("Replace a")).toBeInTheDocument();
    });

    it("rejects a file the gallery would not have accepted, and says so", () => {
      // A replacement never passes through the dropzone, so if the row does not
      // check the type itself, nothing does. And a silent rejection reads as a
      // broken button — that is exactly how an `.avif` presented in browser QA,
      // so the toast is part of the contract, not decoration.
      const onChange = renderGallery();

      pickInto("Replace b", new File(["x"], "notes.pdf", { type: "application/pdf" }));

      expect(onChange).not.toHaveBeenCalled();
      expect(toastError).toHaveBeenCalledWith(
        "notes.pdf isn't a supported image type",
      );
    });

    it("rejects a file over the size cap, and says so", () => {
      const onChange = renderGallery();
      const huge = new File(["x"], "huge.png", { type: "image/png" });
      Object.defineProperty(huge, "size", { value: 6 * 1024 * 1024 });

      pickInto("Replace b", huge);

      expect(onChange).not.toHaveBeenCalled();
      expect(toastError).toHaveBeenCalledWith("huge.png is too large");
    });

    it("does not mutate the array it was given", () => {
      const value = [stored("a"), stored("b")];
      const onChange = vi.fn();
      renderWithProviders(
        <ImageGalleryUpload value={value} onChange={onChange} maxFiles={5} />,
      );

      pickInto("Replace a", new File(["x"], "new.png", { type: "image/png" }));

      expect(ids(value)).toEqual(["a", "b"]);
    });
  });
});
