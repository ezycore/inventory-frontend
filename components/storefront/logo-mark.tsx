"use client";
// coding-standard: maintained

import { useLogoTone } from "@/hooks/use-logo-tone";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/** Square brand chip showing the store's initial — used in the header + footer. */
export function LogoMark({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? 9 : 7,
        background: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--on-primary)",
        fontWeight: 700,
        fontSize: size > 32 ? 18 : 14,
        flex: "none",
      }}
    >
      {(name || "S").charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Store brand lockup for the header/footer: renders the uploaded logo image when
 * one is set (height-constrained, aspect-preserved), otherwise the initial chip
 * next to the store name (with an optional tagline line).
 */
export function Brand({
  name,
  logo,
  markSize = 38,
  nameSize = 18,
  tagline,
}: {
  name: string;
  logo?: string;
  markSize?: number;
  nameSize?: number;
  tagline?: string;
}) {
  if (logo) {
    return <LogoImage src={logo} alt={name} height={markSize + 4} maxWidth={markSize * 4} />;
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoMark name={name} size={markSize} />
      {tagline !== undefined ? (
        <span>
          <span style={{ display: "block", fontWeight: 700, fontSize: nameSize, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {name}
          </span>
          {tagline ? (
            <span style={{ display: "block", fontSize: 10, color: "var(--faint)", letterSpacing: "0.08em", marginTop: 2 }}>
              {tagline}
            </span>
          ) : null}
        </span>
      ) : (
        <span style={{ fontWeight: 700, fontSize: nameSize, letterSpacing: "-0.02em" }}>
          {name}
        </span>
      )}
    </span>
  );
}

/** Plate colours are fixed rather than themed tokens on purpose: the plate only
 *  exists because the themed surface is the wrong tone for this particular
 *  logo, so painting it in a token of that same theme would achieve nothing. */
const PLATE_FOR_DARK_INK = "#ffffff";
const PLATE_FOR_LIGHT_INK = "#0f172a";
/** Inset around a plated logo. Taken back off the image height so the header
 *  keeps its exact size whether or not a plate is applied. */
const PLATE_PAD = 4;

/**
 * The uploaded logo, height-constrained and aspect-preserved.
 *
 * A logo with no backdrop of its own is drawn in one ink colour and the
 * storefront has two backdrops, so a black wordmark vanishes on the dark theme
 * and a white one vanishes on the light theme. `useLogoTone` measures which
 * case a given file is in (see `lib/logo-tone.ts`); when the ink matches the
 * page tone, the mark is set on a small contrasting plate — the same thing a
 * print-ready logo gets on a dark ad.
 *
 * Everything else renders bare, exactly as before: a logo with its own
 * background, a mid-tone or multi-colour mark, and any file the browser refuses
 * to let us sample. Adding the plate only where it is provably needed is the
 * point — plating every logo would put a white box around the wordmarks that
 * were designed for dark headers.
 */
function LogoImage({
  src,
  alt,
  height,
  maxWidth,
}: {
  src: string;
  alt: string;
  height: number;
  maxWidth: number;
}) {
  const { theme } = useStorefrontUI();
  const tone = useLogoTone(src);
  // Dark ink on the dark theme, or light ink on the light theme — the two cases
  // where the logo and the page behind it are the same tone.
  const plated = tone !== null && tone === theme;

  return (
    <span
      style={{
        display: "inline-flex",
        ...(plated
          ? {
              background:
                tone === "dark" ? PLATE_FOR_DARK_INK : PLATE_FOR_LIGHT_INK,
              padding: PLATE_PAD,
              borderRadius: 8,
            }
          : null),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          height: plated ? height - PLATE_PAD * 2 : height,
          width: "auto",
          maxWidth: maxWidth - (plated ? PLATE_PAD * 2 : 0),
          objectFit: "contain",
          display: "block",
        }}
      />
    </span>
  );
}
