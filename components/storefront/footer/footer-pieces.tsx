"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type { StoreFooterStyle } from "@/lib/storefront-client";
import { footerGroupStartsOpen } from "@/lib/storefront-footer/style";
import { Icon } from "@/components/storefront/sf-icons";
import { Brand } from "@/components/storefront/logo-mark";
import type {
  FooterColumn,
  FooterLinkItem,
  FooterPromise,
  FooterT,
} from "@/components/storefront/footer/footer-model";

/** The centred layout's inline link row. */
export const footerLink: CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  textDecoration: "none",
};

/**
 * One resolved link. Internal targets are a client-side `<Link>`; anything that
 * leaves the shop (or opens on the device — `tel:`, `mailto:`) is a plain `<a>`,
 * and only an absolute link the merchant marked opens a new tab.
 */
export function FooterAnchor({
  item,
  className = "sf-footer-link",
  style,
}: {
  item: FooterLinkItem;
  className?: string;
  style?: CSSProperties;
}) {
  if (!item.external) {
    return (
      <Link href={item.href} className={className} style={style}>
        {item.label}
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      className={className}
      style={style}
      {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {item.label}
    </a>
  );
}

/**
 * One link column. Below 680px the heading is a real accordion toggle; on
 * desktop CSS makes it inert and always shows the links.
 *
 * `defaultOpen` is the merchant's phone setting (`footerStyle.phoneGroups`).
 * It is the SAME on the server and the client, so hydration never disagrees,
 * and desktop ignores it because the stylesheet forces the body open there.
 */
export function FooterCol({
  column,
  defaultOpen = true,
}: {
  column: FooterColumn;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
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

/** The link columns in order, each opening per the phone setting. */
export function FooterCols({
  columns,
  footerStyle,
}: {
  columns: FooterColumn[];
  footerStyle?: StoreFooterStyle;
}) {
  return (
    <>
      {columns.map((c, i) => (
        <FooterCol
          key={c.key}
          column={c}
          defaultOpen={footerGroupStartsOpen(footerStyle?.phoneGroups, i)}
        />
      ))}
    </>
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
 * `lead` is the identity side. Each layout fills it differently — brand +
 * contact, brand + sign-up, brand alone — and that is the only structural
 * difference between three of the five layouts.
 */
export function FooterColumns({
  lead,
  columns,
  footerStyle,
}: {
  lead: ReactNode;
  columns: FooterColumn[];
  footerStyle?: StoreFooterStyle;
}) {
  return (
    <div className="sf-footer-grid">
      <div className="sf-footer-lead">{lead}</div>
      <div className="sf-footer-cols">
        <FooterCols columns={columns} footerStyle={footerStyle} />
      </div>
    </div>
  );
}

/**
 * The store's mark and its about line. `logoHeight` is the footer-only logo's
 * own height (Customize → Footer); unset keeps the layout's 31px mark.
 */
export function FooterBrand({
  name,
  logo,
  logoHeight,
  blurb,
}: {
  name: string;
  logo?: string;
  logoHeight?: number;
  blurb?: string;
}) {
  // `Brand` draws a logo at `markSize + 4`, so the height is converted back.
  const markSize = logoHeight ? logoHeight - 4 : 31;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: blurb ? 12 : 0 }}>
        <Brand name={name} logo={logo} markSize={markSize} nameSize={16} />
      </div>
      {blurb ? (
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
          {blurb}
        </p>
      ) : null}
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

/** The editor's cap on promises, so a full set fits one desktop row. */
const PROMISES_MAX = 4;
/** The band's pre-existing desktop track count, kept for one to three promises. */
const PROMISES_MIN_COLS = 3;

/**
 * The merchant's store promises as one tinted band. A band rather than three
 * floating icons: the row is one claim about the shop, and giving it a ground
 * says so without a heading.
 *
 * Desktop keeps its three tracks for one to three promises — where every shop
 * that has them sits today — and widens to four for a fourth, which used to wrap
 * 3 + 1. Phones stack them.
 */
export function FooterPromises({ promises }: { promises: FooterPromise[] }) {
  if (!promises.length) return null;
  const cols = Math.max(PROMISES_MIN_COLS, Math.min(promises.length, PROMISES_MAX));
  return (
    <div className="sf-footer-trustbar" style={{ "--ft-trustcols": cols } as CSSProperties}>
      {promises.map((promise) => (
        <div key={promise.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--primary)", display: "flex", flex: "none" }}>
            <Icon name={promise.icon} size={19} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{promise.label}</span>
        </div>
      ))}
    </div>
  );
}
