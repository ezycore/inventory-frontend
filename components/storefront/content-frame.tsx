"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import type { StoreTemplates } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { resolveTemplates } from "@/lib/storefront-templates";

/**
 * The frame around a titled body — used by the CMS content pages and the
 * order-tracking page, in **one of four whole layouts** chosen by
 * `templates.contentLayout`.
 *
 * These two pages were the last storefront surfaces with no theme awareness at
 * all: a policy page and a tracking lookup looked byte-identical in every theme
 * apart from colour and radius. They share a frame rather than getting one each
 * because they are the same shape — a heading, an optional meta line, a body —
 * and giving them separate axes would be two controls for one decision.
 *
 * A frame owns the chrome and nothing else. The body it wraps is the page's own.
 */
export function ContentFrame({
  title,
  meta,
  children,
  align,
}: {
  title: ReactNode;
  /** Small line under the title (a date, a status). Optional. */
  meta?: ReactNode;
  children: ReactNode;
  /** Centres the body — the tracking page's empty state wants it, prose does not. */
  align?: "center";
}) {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  const draft = useSfPreview((s) => s.contentLayout);
  const layout = isContentLayout(draft)
    ? draft
    : resolveTemplates(store).contentLayout;
  const Frame = CONTENT_FRAMES[layout] ?? CenteredFrame;
  return (
    <Frame title={title} meta={meta} align={align}>
      {children}
    </Frame>
  );
}

interface FrameProps {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  align?: "center";
}

const prose: CSSProperties = { maxWidth: 780, margin: "0 auto", padding: "30px var(--pad) 64px" };

/**
 * Centered — a prose column, the title over a hairline.
 *
 * **The storefront's original frame, unchanged**, so Classic stamps it and it is
 * the resolver's default: an untouched shop's About page is byte-for-byte what
 * it was before this axis existed.
 */
function CenteredFrame({ title, meta, children, align }: FrameProps) {
  return (
    <article style={{ ...prose, textAlign: align }}>
      <header style={{ paddingBottom: 18, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          {title}
        </h1>
        {meta ? <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--faint)" }}>{meta}</div> : null}
      </header>
      {children}
    </article>
  );
}

/**
 * Banner — a full-bleed brand-coloured header, then the body on a card.
 *
 * The everyday-retail answer: the same shape as an app's screen header, so a
 * shopper who arrived from the header's "Track order" link knows immediately
 * that they left the catalogue. The card keeps the body clearly separate from
 * the chrome, which is what makes a returns policy scannable rather than
 * decorative.
 */
function BannerFrame({ title, meta, children, align }: FrameProps) {
  return (
    <article style={{ textAlign: align }}>
      <div style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
        <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "clamp(22px,4vw,38px) var(--pad)" }}>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            {title}
          </h1>
          {meta ? <div style={{ marginTop: 7, fontSize: 12.5, opacity: 0.85 }}>{meta}</div> : null}
        </div>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 var(--pad) 64px" }}>
        <div
          style={{
            marginTop: -18,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "clamp(20px,3vw,32px)",
          }}
        >
          {children}
        </div>
      </div>
    </article>
  );
}

/**
 * Panel — the title on a tinted block, the body on a plain card beneath, both
 * generously spaced.
 *
 * The calm answer, matching the pharmacy's account area: nothing is full-bleed,
 * nothing is loud, and the two blocks are separated by space rather than by a
 * rule. Reads well at the larger text sizes an older customer is likely to have
 * set, because nothing here depends on a hairline being visible.
 */
function PanelFrame({ title, meta, children, align }: FrameProps) {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "26px var(--pad) 64px", textAlign: align }}>
      <div
        style={{
          background: "var(--primary-soft)",
          borderRadius: "var(--radius-lg)",
          padding: "clamp(18px,3vw,26px)",
          marginBottom: 18,
        }}
      >
        <h1 style={{ fontSize: "clamp(23px, 3.4vw, 30px)", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--text)" }}>
          {title}
        </h1>
        {meta ? <div style={{ marginTop: 7, fontSize: 12.5, color: "var(--muted)" }}>{meta}</div> : null}
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "clamp(20px,3vw,30px)",
        }}
      >
        {children}
      </div>
    </article>
  );
}

/**
 * Editorial — an eyebrow, a large light-weight title, no rule, no card, and a
 * narrower measure than the others.
 *
 * The boutique answer, and the same reasoning as its account area and checkout:
 * a shop that drops its borders everywhere else should not put its About page in
 * a box. The narrower column is not decoration — 66 characters is where prose
 * stops being tiring, and this is the only frame whose pages are mostly prose.
 */
function EditorialFrame({ title, meta, children, align }: FrameProps) {
  return (
    <article style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(34px,5vw,64px) var(--pad) 72px", textAlign: align }}>
      <header style={{ marginBottom: 30 }}>
        {meta ? (
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 12 }}>
            {meta}
          </div>
        ) : null}
        <h1 style={{ fontSize: "var(--h1)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.12, margin: 0 }}>
          {title}
        </h1>
      </header>
      {children}
    </article>
  );
}

const CONTENT_FRAMES: Record<
  StoreTemplates["contentLayout"],
  (props: FrameProps) => ReactNode
> = {
  centered: CenteredFrame,
  banner: BannerFrame,
  panel: PanelFrame,
  editorial: EditorialFrame,
};

function isContentLayout(v: unknown): v is StoreTemplates["contentLayout"] {
  return v === "centered" || v === "banner" || v === "panel" || v === "editorial";
}
