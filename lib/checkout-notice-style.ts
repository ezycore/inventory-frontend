// coding-standard: maintained

import type { CheckoutNoticeSize, CheckoutNoticeTone } from "@/types";

/**
 * How a merchant's checkout notice is painted.
 *
 * **One module, two consumers, on purpose.** The storefront renders a notice
 * against its CSS custom properties (`var(--surface)`, `var(--accent)`, …) so it
 * follows the merchant's brand, the chosen palette and the dark toggle. The
 * admin editor cannot: it lives under the shadcn tokens with no `.sf-root`
 * above it, so its swatch has to be literal. Keeping both in one file is what
 * stops the preview chip and the real notice drifting apart — which would make
 * the chip worse than no preview at all, because the merchant would trust it.
 *
 * The literals here are the LIGHT-theme values of the same tokens defined in
 * `app/(storefront)/storefront.css`; change one, change the other.
 */
export const NOTICE_TONES: {
  value: CheckoutNoticeTone;
  label: string;
  /** What it is for — shown under the swatch so a merchant picks by meaning. */
  hint: string;
}[] = [
  { value: "plain", label: "Plain", hint: "Quiet guidance" },
  { value: "info", label: "Info", hint: "Something to know" },
  { value: "warn", label: "Warning", hint: "Something that costs them" },
  { value: "success", label: "Good news", hint: "A promise you are keeping" },
  { value: "accent", label: "Brand", hint: "Your second colour" },
];

export interface NoticeSurface {
  background: string;
  border: string;
  color: string;
  /** The heavier tones carry their meaning in the text weight too. */
  fontWeight: number;
}

/** Storefront paint — CSS vars, so brand + palette + dark mode all apply. */
export function noticeSurface(tone: CheckoutNoticeTone = "plain"): NoticeSurface {
  switch (tone) {
    case "info":
      return {
        background: "var(--primary-soft)",
        border: "var(--primary)",
        color: "var(--text)",
        fontWeight: 500,
      };
    case "warn":
      return {
        background: "var(--note-warn-soft)",
        border: "var(--note-warn-border)",
        color: "var(--note-warn)",
        fontWeight: 600,
      };
    case "success":
      return {
        background: "var(--note-success-soft)",
        border: "var(--note-success-border)",
        color: "var(--note-success)",
        fontWeight: 500,
      };
    case "accent":
      return {
        background: "var(--accent-soft)",
        border: "var(--accent)",
        color: "var(--text)",
        fontWeight: 500,
      };
    default:
      // Exactly what every notice rendered as before tones existed, so an
      // untouched store sees no change on deploy.
      return {
        background: "var(--surface)",
        border: "var(--border)",
        color: "var(--muted)",
        fontWeight: 400,
      };
  }
}

/** Admin paint — the same tones as literals, for the editor's preview swatch. */
export function noticeSurfaceLiteral(
  tone: CheckoutNoticeTone = "plain",
): NoticeSurface {
  switch (tone) {
    case "info":
      return { background: "#eff6ff", border: "#2563eb", color: "#0f172a", fontWeight: 500 };
    case "warn":
      return { background: "#fffbeb", border: "#fcd34d", color: "#92400e", fontWeight: 600 };
    case "success":
      return { background: "#f0fdf4", border: "#86efac", color: "#166534", fontWeight: 500 };
    case "accent":
      // The brand is per-store and the editor has no store shell to read it
      // from, so the swatch shows the DEFAULT accent and says so in the hint.
      return { background: "#eff6ff", border: "#2563eb", color: "#0f172a", fontWeight: 500 };
    default:
      return { background: "#f1f5f9", border: "#e5e7eb", color: "#64748b", fontWeight: 400 };
  }
}

export const NOTICE_SIZES: { value: CheckoutNoticeSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

/**
 * Text metrics per size. `sm` reproduces the original notice exactly (13px /
 * 1.55 / 10px 13px); the larger ones grow the padding with the type so the box
 * does not end up a tight band around big text.
 */
export function noticeMetrics(size: CheckoutNoticeSize = "sm"): {
  fontSize: number;
  lineHeight: number;
  padding: string;
} {
  switch (size) {
    case "md":
      return { fontSize: 14.5, lineHeight: 1.55, padding: "12px 15px" };
    case "lg":
      return { fontSize: 16.5, lineHeight: 1.5, padding: "15px 17px" };
    default:
      return { fontSize: 13, lineHeight: 1.55, padding: "10px 13px" };
  }
}
