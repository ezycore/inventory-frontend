"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type {
  ContentPageLink,
  StoreFooterContentPages,
  StoreFooterGroup,
  StoreFooterPaymentMethods,
  StorefrontStore,
} from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { stripVisibilityClass } from "@/lib/storefront-strip-display";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { Brand } from "@/components/storefront/logo-mark";

export type FooterT = ReturnType<typeof useStorefrontUI>["t"];

/** A resolved footer link (external merchant URL or an internal CMS page). */
export interface FooterLinkItem {
  key: string;
  label: string;
  href: string;
  external: boolean;
}

/** One titled footer column (a merchant group or the content-pages block). */
export interface FooterColumn {
  key: string;
  title: string;
  links: FooterLinkItem[];
}

/**
 * Shared props built once in `StoreFooter` and passed to each variant.
 *
 * Everything a variant renders arrives here, and **every string in it is either
 * the merchant's or a localized default** — there is no copy baked into a
 * variant body. That is the rule the 2026-08-11 rebuild exists to hold: a footer
 * that prints something the owner cannot change is a footer they will ask us to
 * change for them.
 */
export interface FooterProps {
  base: string;
  /** Needed by the sign-up form — it posts to this store's public endpoint. */
  slug: string;
  store?: StorefrontStore;
  t: FooterT;
  name: string;
  logo?: string;
  phone: string;
  footerGroups: StoreFooterGroup[];
  /** Where enabled checkout methods should be advertised in the bottom bar. */
  footerPaymentMethods?: StoreFooterPaymentMethods;
  footerContentPages?: StoreFooterContentPages;
  infoPages: ContentPageLink[];
  /**
   * The brand paragraph, **already resolved** — `copy.footerText` if the
   * merchant wrote one, the localized default otherwise. Resolved in
   * `StoreFooter` rather than here because the live Customize draft has to win
   * over the saved value, and only that component sees the draft.
   */
  blurb: string;
  /** `copy.footerNote` — the bottom bar's right side. Blank ⇒ currency only. */
  note?: string;
  /** `copy.footerContactHeading` — Contact-first heading. Blank ⇒ localized. */
  contactHeading?: string;
  /** `copy.footerNewsletter` — sign-up copy. Blank fields ⇒ localized. */
  newsletter?: { heading?: string; blurb?: string; buttonLabel?: string };
}

export const uppercaseLabel: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
export const footerLink: CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  textDecoration: "none",
};

/* ------------------------------ column model ------------------------------ */

/** Each merchant footer group becomes its own column (external links). */
export function groupColumns(groups: StoreFooterGroup[]): FooterColumn[] {
  return groups.map((g, i) => ({
    key: `g${i}:${g.title}`,
    title: g.title,
    links: g.links.map((lk, li) => ({
      key: `${i}:${li}:${lk.label}`,
      label: lk.label,
      href: lk.url || "#",
      external: true,
    })),
  }));
}

/**
 * The auto content-pages column ("Information"), or `null` when the merchant
 * hid it or no pages are flagged for the footer. Heading override falls back to
 * the built-in localized label.
 */
export function contentPagesColumn(
  infoPages: ContentPageLink[],
  cfg: StoreFooterContentPages | undefined,
  base: string,
  fallbackTitle: string,
): FooterColumn | null {
  if (cfg?.show === false || infoPages.length === 0) return null;
  return {
    key: "info",
    title: cfg?.title?.trim() || fallbackTitle,
    links: infoPages.map((pg) => ({
      key: pg._id,
      label: pg.title,
      href: storeHref(base, `/pages/${pg.slug}`),
      external: false,
    })),
  };
}

/** Merchant groups followed by the content-pages column (when shown). */
export function footerColumns(props: FooterProps): FooterColumn[] {
  const info = contentPagesColumn(
    props.infoPages,
    props.footerContentPages,
    props.base,
    props.t.information,
  );
  const groups = groupColumns(props.footerGroups);
  return info ? [...groups, info] : groups;
}

/* -------------------------------- rendering ------------------------------- */

function FooterAnchor({ item }: { item: FooterLinkItem }) {
  return item.external ? (
    <a href={item.href} className="sf-footer-link">
      {item.label}
    </a>
  ) : (
    <Link href={item.href} className="sf-footer-link">
      {item.label}
    </Link>
  );
}

/**
 * One link column. Exported because Contact-first lays its columns out in its
 * own three-track grid rather than through `FooterColumns` — but must still get
 * the same accordion behaviour below 680px.
 */
export function FooterCol({ column }: { column: FooterColumn }) {
  // Renders open (matches SSR + desktop). Below 680px the heading is a real
  // accordion toggle; on desktop CSS makes it inert and always shows the links.
  const [open, setOpen] = useState(true);
  const bodyId = `sf-foot-${column.key.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div className={open ? "sf-footer-col sf-open" : "sf-footer-col"}>
      <button
        type="button"
        className="sf-footer-col-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{column.title}</span>
        <Icon name="chevD" size={16} className="sf-footer-chev" />
      </button>
      <ul id={bodyId} className="sf-footer-col-body">
        {column.links.map((l) => (
          <li key={l.key}>
            <FooterAnchor item={l} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The columned footer body: an identity block on the left and the link columns
 * **anchored to the right edge**, each sized to its own content.
 *
 * That sizing is the whole repair. The columns used to be
 * `repeat(auto-fit, minmax(132px, 1fr))` inside a `3fr` track, so every column
 * stretched to fill whatever space was left while its links stayed ~70px of
 * left-aligned text. It was written for a shop with three or four link groups;
 * most shops have one, and with none configured the two remaining stacks were
 * ~336px wide each and half the footer was empty. Content-sized tracks look
 * deliberate at one group **and** at four, which is what a layout has to do when
 * it cannot know how many it will get.
 *
 * `lead` is the identity side. Each variant fills it differently — brand +
 * contact, brand + sign-up, brand alone — and that is the only structural
 * difference between three of the five layouts.
 */
export function FooterColumns({
  lead,
  columns,
}: {
  lead: ReactNode;
  columns: FooterColumn[];
}) {
  return (
    <div className="sf-footer-grid">
      <div className="sf-footer-lead">{lead}</div>
      <div className="sf-footer-cols">
        {columns.map((c) => (
          <FooterCol key={c.key} column={c} />
        ))}
      </div>
    </div>
  );
}

export function FooterBrand({
  name,
  logo,
  blurb,
}: {
  name: string;
  logo?: string;
  blurb: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <Brand name={name} logo={logo} markSize={31} nameSize={16} />
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
        {blurb}
      </p>
    </div>
  );
}

/**
 * The merchant's number as one quiet line, and a real `tel:` link — a shopper on
 * a phone reading a footer is one tap from calling, and printing the digits as
 * plain text throws that away.
 */
export function FooterCallLine({ phone, t }: { phone: string; t: FooterT }) {
  if (!phone.trim()) return null;
  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12.5,
        color: "var(--muted)",
        textDecoration: "none",
      }}
    >
      <Icon name="phone" size={15} /> {t.callUs} {phone}
    </a>
  );
}

export function PaymentBadges({
  store,
  t,
  compact,
  className,
}: {
  store?: StorefrontStore;
  t: FooterT;
  /** Bottom-bar sizing — the badges sit beside 12px text there, not on their own. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {(store?.allowedPaymentMethods ?? ["cod", "bank"]).map((m) => (
        <span
          key={m}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: compact ? 11 : 11.5,
            fontWeight: 600,
            padding: compact ? "4px 9px" : "6px 10px",
            borderRadius: 7,
          }}
        >
          {m === "cod" ? t.cod : t.bankTransfer}
        </span>
      ))}
    </div>
  );
}

export function FooterShell({
  children,
  pad = "36px var(--pad) 28px",
}: {
  children: ReactNode;
  pad?: string;
}) {
  return (
    <footer
      style={{ background: "var(--card)", borderTop: "1px solid var(--border)", marginTop: 20 }}
    >
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: pad }}>{children}</div>
    </footer>
  );
}

/**
 * The closing line: copyright, the accepted payment methods, and the merchant's
 * own note.
 *
 * **Payments live here, not in a link column.** They are a reassurance, not
 * navigation — and putting them in the columns region is what forced the extra
 * track that left the gap `FooterColumns` describes.
 *
 * The right-hand side is `copy.footerNote`. It used to be the hardcoded string
 * `"Bangladesh · <currency>"`, which is a claim about the merchant's business
 * that the platform has no standing to make; unset, it now prints the store's
 * currency and nothing more.
 */
export function BottomBar({
  name,
  currency,
  note,
  store,
  t,
  footerPaymentMethods,
  center,
}: {
  name: string;
  currency?: string;
  note?: string;
  store?: StorefrontStore;
  t: FooterT;
  footerPaymentMethods?: StoreFooterPaymentMethods;
  /** Centered layouts stack this instead of spreading it. */
  center?: boolean;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: 16,
        width: "100%",
        fontSize: 12,
        color: "var(--faint)",
        display: "flex",
        justifyContent: center ? "center" : "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        textAlign: center ? "center" : undefined,
        gap: center ? 10 : "8px 18px",
      }}
    >
      <span>
        © {new Date().getFullYear()} {name} · {t.poweredBy}{" "}
        {/* ⚠ **A new tab, deliberately.** This is the one link in the shop that
            leads away from the merchant's own storefront, and a shopper who
            follows it in the same tab is a sale they have lost to our marketing
            site. `rel="noopener"` and nothing more: the referrer is how the
            visit is attributed, and this is our own domain, not a third
            party's. */}
        <a
          href="https://ezycore.com/"
          target="_blank"
          rel="noopener"
          className="sf-powered-link"
        >
          EzyCore
        </a>
      </span>
      <PaymentBadges
        store={store}
        t={t}
        compact
        className={stripVisibilityClass(
          footerPaymentMethods?.showOnDesktop,
          footerPaymentMethods?.showOnMobile,
        )}
      />
      <span>{note?.trim() || currency || ""}</span>
    </div>
  );
}
