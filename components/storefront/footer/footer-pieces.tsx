"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type {
  ContentPageLink,
  StoreFooterContentPages,
  StoreFooterGroup,
  StorefrontStore,
} from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
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

/** Shared props built once in `StoreFooter` and passed to each variant. */
export interface FooterProps {
  base: string;
  store?: StorefrontStore;
  t: FooterT;
  name: string;
  logo?: string;
  phone: string;
  footerGroups: StoreFooterGroup[];
  footerContentPages?: StoreFooterContentPages;
  infoPages: ContentPageLink[];
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

function FooterCol({ column }: { column: FooterColumn }) {
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
 * The columned footer body: brand block on the left, one column per group +
 * the content-pages column, and an aside (payments / contact) as the last
 * column. Collapses to stacked accordions below 680px.
 */
export function FooterColumns({
  brand,
  columns,
  aside,
}: {
  brand: ReactNode;
  columns: FooterColumn[];
  aside?: ReactNode;
}) {
  return (
    <div className="sf-footer-grid">
      <div>{brand}</div>
      <div className="sf-footer-cols">
        {columns.map((c) => (
          <FooterCol key={c.key} column={c} />
        ))}
        {aside ? <div className="sf-footer-aside">{aside}</div> : null}
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
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
        {blurb}
      </p>
    </div>
  );
}

/** The "We accept" payment badges + call-us line (footer aside column). */
export function FooterPayments({
  store,
  t,
  phone,
}: {
  store?: StorefrontStore;
  t: FooterT;
  phone: string;
}) {
  return (
    <div>
      <div style={{ ...uppercaseLabel, marginBottom: 11 }}>{t.weAccept}</div>
      <PaymentBadges store={store} t={t} />
      {phone ? (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            color: "var(--muted)",
          }}
        >
          <Icon name="phone" size={15} /> {t.callUs} {phone}
        </div>
      ) : null}
    </div>
  );
}

export function PaymentBadges({ store, t }: { store?: StorefrontStore; t: FooterT }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {(store?.allowedPaymentMethods ?? ["cod", "bank"]).map((m) => (
        <span
          key={m}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "6px 10px",
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

export function BottomBar({
  name,
  currency,
  t,
}: {
  name: string;
  currency?: string;
  t: FooterT;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: 16,
        fontSize: 12,
        color: "var(--faint)",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <span>
        © {new Date().getFullYear()} {name} · {t.poweredBy} EzyCore
      </span>
      <span>Bangladesh · {currency ?? "BDT"}</span>
    </div>
  );
}
