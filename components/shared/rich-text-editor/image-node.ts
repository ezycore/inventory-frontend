// coding-standard: maintained
import Image from "@tiptap/extension-image";
import {
  IMAGE_ALIGNS,
  IMAGE_WIDTHS,
  type RichDocImageAlign,
  type RichDocImageWidth,
} from "@/lib/storefront-rich-doc";

/**
 * The body image, with the two controls a merchant actually needs: how wide and
 * where on the line.
 *
 * **Width is a PERCENTAGE, not pixels.** A merchant sizes an image on a ~600px
 * desktop editor; the same image renders in a ~360px phone column, which is
 * where most of this storefront's traffic is. A pixel width chosen on one is
 * simply wrong on the other, and a 2000px camera upload pinned at its natural
 * size would force the whole page to scroll sideways. A percentage is right on
 * both by construction, and the preset list keeps it to choices that mean
 * something rather than a resize handle producing 37%.
 *
 * Both attributes are re-validated by the storefront renderer against these same
 * two lists — the stored tree is writable through the raw API, so what the editor
 * allows is a convenience and what the renderer accepts is the rule.
 */
export const ConfiguredImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100 as RichDocImageWidth,
        parseHTML: (element) => {
          const raw = Number(element.getAttribute("data-width"));
          return (IMAGE_WIDTHS as readonly number[]).includes(raw) ? raw : 100;
        },
        // Mirrored onto `data-width` AND onto the inline style: the attribute is
        // what survives a copy/paste round trip through the DOM, the style is
        // what the merchant sees while editing.
        renderHTML: (attributes) => {
          const width = attributes.width as RichDocImageWidth;
          return { "data-width": String(width), style: `width:${width}%` };
        },
      },
      /**
       * Text flows beside the image instead of below it.
       *
       * Rendered as a data attribute, never as an inline `float`: it must switch
       * off below the storefront's 680px breakpoint, where a 50% float would
       * leave two ~170px strips that are unreadable in both columns. Only CSS
       * can express that, so the CSS owns the float and this owns the intent.
       */
      wrap: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-wrap") === "1",
        renderHTML: (attributes) =>
          attributes.wrap ? { "data-wrap": "1" } : {},
      },
      align: {
        default: "center" as RichDocImageAlign,
        parseHTML: (element) => {
          const raw = element.getAttribute("data-align");
          return (IMAGE_ALIGNS as readonly string[]).includes(raw ?? "")
            ? raw
            : "center";
        },
        renderHTML: (attributes) => ({
          "data-align": String(attributes.align),
        }),
      },
    };
  },
}).configure({ inline: false, allowBase64: false });
