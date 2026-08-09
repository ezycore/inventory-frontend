"use client";
// coding-standard: maintained

import { useStoreLogoStyle } from "@/services/storefront/use-logo-style";

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

/**
 * The uploaded logo, with the owner's chrome applied (Customize → Brand).
 *
 * The chrome exists because a transparent wordmark is drawn in ONE ink colour
 * while the storefront has two backdrops: black type disappears on the dark
 * theme, white type on the light one, and nothing in the file says which you
 * have. Only the owner knows, so they set a backdrop — one colour that works
 * under both themes, which is why `background` is a literal hex and not a theme
 * token.
 *
 * A **height** override applies at every placement, so the number the owner
 * types is the number of pixels they get in the header, the mobile bar and the
 * footer alike. The alternative — scaling each placement by a ratio — keeps the
 * design's size hierarchy but makes "48" mean 48 in exactly one of them, which
 * is not a control anyone can aim.
 *
 * With no overrides this renders identically to the plain `<img>` it replaced.
 */
function LogoImage({
  src,
  alt,
  height,
  maxWidth,
}: {
  src: string;
  alt: string;
  /** The placement's default height, used when the owner set none. */
  height: number;
  maxWidth: number;
}) {
  const style = useStoreLogoStyle();
  const boxHeight = style.height ?? height;
  // Padding is taken OUT of the height rather than added to it, so raising the
  // padding insets the mark instead of growing the header around it.
  const imageHeight = Math.max(boxHeight - style.padding * 2, 1);

  return (
    <span
      style={{
        display: "inline-flex",
        background: style.background,
        padding: style.padding,
        borderRadius: style.radius,
        flex: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          height: imageHeight,
          width: "auto",
          maxWidth,
          objectFit: "contain",
          display: "block",
        }}
      />
    </span>
  );
}
