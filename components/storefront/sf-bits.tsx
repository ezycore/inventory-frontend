// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import { ORDER_STATUS, type Lang } from "@/lib/storefront-i18n";
import { money, discountPct } from "@/components/storefront/format";

/**
 * Striped placeholder used wherever a real image is missing — mirrors the
 * design's `repeating-linear-gradient` + monospace label chip. Never draw fake
 * product art; this keeps empty media honest and on-brand.
 */
export function Placeholder({
  label,
  ratio = "1 / 1",
  radius = 11,
  style,
}: {
  label?: string;
  ratio?: string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        aspectRatio: ratio,
        borderRadius: radius,
        background:
          "repeating-linear-gradient(135deg, var(--surface-2), var(--surface-2) 11px, var(--surface) 11px, var(--surface) 22px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--border)",
        ...style,
      }}
    >
      {label ? (
        <span
          className="sf-mono"
          style={{
            fontSize: 12,
            color: "var(--muted)",
            background: "var(--card)",
            padding: "6px 11px",
            borderRadius: 7,
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Media: a real image (or a striped placeholder) filling a fixed-ratio box.
 *
 * `fit="cover"` (default) crops to fill — right for small thumbs (cart rows,
 * search results, gallery rail) where a uniform crop reads as intentional.
 * `fit="canvas"` shows the WHOLE photo (`object-fit: contain`) over a
 * blurred, scaled-up copy of itself filling the rest of the box — so a photo
 * shot to a different ratio than the slot never loses its edges (a logo near
 * the bottom, a subject off-centre), and there's no hard-edged letterbox bar
 * against a busy lifestyle shot. Costs one extra `<img>` of the same (cached)
 * src; no image analysis, no upload constraint.
 */
export function Media({
  src,
  alt,
  label,
  ratio = "1 / 1",
  radius = 11,
  fit = "cover",
  className,
  style,
}: {
  src?: string | null;
  alt?: string;
  label?: string;
  ratio?: string;
  radius?: number;
  fit?: "cover" | "canvas";
  className?: string;
  style?: CSSProperties;
}) {
  if (src) {
    if (fit === "canvas") {
      return (
        <div
          className={className}
          style={{
            position: "relative",
            aspectRatio: ratio,
            width: "100%",
            overflow: "hidden",
            borderRadius: radius,
            background: "var(--surface)",
            ...style,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-8%",
              width: "116%",
              height: "116%",
              objectFit: "cover",
              filter: "blur(22px) saturate(1.2) brightness(0.88)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            style={{ position: "relative", width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ""}
        className={className}
        style={{
          aspectRatio: ratio,
          width: "100%",
          objectFit: "cover",
          borderRadius: radius,
          ...style,
        }}
      />
    );
  }
  return <Placeholder label={label} ratio={ratio} radius={radius} style={style} />;
}

/** Price block: current price, struck compare-at, and a discount % tag. */
export function Price({
  price,
  compareAt,
  currency,
  size = 15,
  showTag = false,
}: {
  price: number | null | undefined;
  compareAt?: number | null;
  currency?: string;
  size?: number;
  showTag?: boolean;
}) {
  const pct = discountPct(price, compareAt);
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
      <span style={{ fontWeight: 700, fontSize: size, color: "var(--text)" }}>
        {money(price, currency)}
      </span>
      {pct > 0 ? (
        <span
          style={{
            fontSize: size - 3,
            color: "var(--faint)",
            textDecoration: "line-through",
          }}
        >
          {money(compareAt, currency)}
        </span>
      ) : null}
      {showTag && pct > 0 ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--discount)",
            background: "var(--discount-soft)",
            padding: "2px 7px",
            borderRadius: 6,
          }}
        >
          -{pct}%
        </span>
      ) : null}
    </span>
  );
}

/** Order-status pill (soft tint + label), localized. */
export function StatusPill({
  status,
  lang,
  size = 11,
}: {
  status: string;
  lang: Lang;
  size?: number;
}) {
  const m = ORDER_STATUS[status] || ORDER_STATUS.pending;
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        // Mix toward the theme text so the hue stays readable on both themes:
        // darkens on light cards, lightens on dark cards.
        color: `color-mix(in srgb, ${m.c} 72%, var(--text))`,
        background: `color-mix(in srgb, ${m.c} 14%, transparent)`,
        padding: "4px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {lang === "bn" ? m.bn : m.en}
    </span>
  );
}

/** Section heading used across storefront pages. */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
      }}
    >
      <h2
        style={{
          fontSize: "var(--h2)",
          fontWeight: 700,
          color: "var(--text)",
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {children}
      </h2>
      {action}
    </div>
  );
}
