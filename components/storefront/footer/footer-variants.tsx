"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { SocialLinks } from "@/components/storefront/social-links";
import { Brand } from "@/components/storefront/logo-mark";
import {
  FooterContactCard,
  useHasContactSurface,
} from "@/components/storefront/footer/footer-contact-card";
import { FooterNewsletter } from "@/components/storefront/footer/footer-newsletter";
import { BottomBar, FooterShell } from "@/components/storefront/footer/footer-frame";
import { footerColumns, type FooterProps } from "@/components/storefront/footer/footer-model";
import {
  FooterAnchor,
  FooterBrand,
  FooterCallLine,
  FooterCols,
  FooterColumns,
  FooterPromises,
  footerBlurb,
  footerLink,
} from "@/components/storefront/footer/footer-pieces";

/**
 * The five footer layouts, all fed from `FooterProps` and nothing else.
 *
 * Three of them (`columns`, `rich`, `contact`) share one body — brand-ish block
 * on the left, content-sized link columns anchored right — and differ only in
 * what fills the left side and what sits above it. That is deliberate: the
 * repair the 2026-08-11 rebuild is for lives in `FooterColumns`, and a variant
 * that re-implemented the grid would quietly opt out of it.
 */

/** The identity side of the columned body: brand, blurb, phone, socials. */
function BrandLead(props: FooterProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15, alignItems: "flex-start" }}>
      <FooterBrand
        name={props.name}
        logo={props.logo}
        logoHeight={props.logoHeight}
        blurb={props.blurb}
      />
      <FooterCallLine phone={props.phone} t={props.t} />
      <SocialLinks social={props.store?.social} size={16} />
    </div>
  );
}

/** Brand + link columns + the closing bar. The shared skeleton of three layouts. */
function ColumnsBody(props: FooterProps) {
  return (
    <FooterColumns
      lead={<BrandLead {...props} />}
      columns={footerColumns(props)}
      footerStyle={props.footerStyle}
    />
  );
}

function Bottom(props: FooterProps, center?: boolean) {
  return (
    <BottomBar
      name={props.name}
      currency={props.store?.currency}
      note={props.note}
      store={props.store}
      t={props.t}
      footerPaymentMethods={props.footerPaymentMethods}
      footerStyle={props.footerStyle}
      center={center}
    />
  );
}

/**
 * **Anchored columns** — the default, and the repair of the layout that shipped
 * before. See `FooterColumns` for what the grid change fixes.
 */
export function ColumnsFooter(props: FooterProps) {
  return (
    <FooterShell footerStyle={props.footerStyle}>
      <ColumnsBody {...props} />
      {Bottom(props)}
    </FooterShell>
  );
}

/**
 * **Trust bar** — the anchored body under a strip of the merchant's own
 * promises. The badges are `store.trustBadges` (Customize → Footer); an empty
 * slot stays empty because shipping, authenticity and payment claims must never
 * be invented by a visual template.
 */
export function RichFooter(props: FooterProps) {
  return (
    <FooterShell footerStyle={props.footerStyle}>
      <FooterPromises promises={props.promises} />

      <ColumnsBody {...props} />
      {Bottom(props)}
    </FooterShell>
  );
}

/**
 * **Contact-first** — the merchant's phone and chat channels lead, link columns
 * anchored right.
 *
 * Degrades to `ColumnsFooter` when the merchant has published neither a number
 * nor a chat channel, because the alternative is an empty card where the whole
 * point of the layout should be. A merchant who picks this and then clears their
 * number gets a correct footer, not a broken one.
 */
export function ContactFooter(props: FooterProps) {
  const reachable = useHasContactSurface(props.store, props.base, props.phone);
  if (!reachable) return <ColumnsFooter {...props} />;

  return (
    <FooterShell footerStyle={props.footerStyle}>
      <div className="sf-footer-grid sf-footer-grid-3">
        <div className="sf-footer-lead">
          <div style={{ display: "flex", flexDirection: "column", gap: 15, alignItems: "flex-start" }}>
            <FooterBrand
              name={props.name}
              logo={props.logo}
              logoHeight={props.logoHeight}
              blurb={props.blurb}
            />
            <SocialLinks social={props.store?.social} size={16} />
          </div>
        </div>
        <div className="sf-footer-aside">
          <FooterContactCard
            store={props.store}
            base={props.base}
            t={props.t}
            heading={props.contactHeading}
            phone={props.phone}
          />
        </div>
        <div className="sf-footer-cols">
          <FooterCols columns={footerColumns(props)} footerStyle={props.footerStyle} />
        </div>
      </div>
      {Bottom(props)}
    </FooterShell>
  );
}

/**
 * **Stay in touch** — the wide left side earns its width by asking for
 * something. The sign-up posts to this store's public `/subscribe` endpoint;
 * addresses land in Online Store → Storefront Accounts → Subscribers.
 *
 * It leads with `FooterBrand` (mark **and** blurb). **All five layouts draw the
 * blurb** — `columns`/`rich`/`contact` through `BrandLead`, `simple` through its
 * own centred `<p>` — and this one was the sole exception until 2026-08-12,
 * rendering the bare mark. So the merchant's "About your shop" line silently
 * vanished the moment they chose this footer: safe in `copy.footerText`, never
 * drawn. That reads as data loss to whoever typed it, and it is exactly what a
 * merchant must be able to trust when trying a theme (Fashion Shine selects this
 * layout). The ask is not weakened by a line of context above it.
 */
export function NewsletterFooter(props: FooterProps) {
  const copy = props.newsletter;
  return (
    <FooterShell footerStyle={props.footerStyle}>
      <FooterColumns
        footerStyle={props.footerStyle}
        lead={
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <FooterBrand
              name={props.name}
              logo={props.logo}
              logoHeight={props.logoHeight}
              blurb={props.blurb}
            />
            <FooterNewsletter
              slug={props.slug}
              t={props.t}
              heading={copy?.heading}
              blurb={copy?.blurb}
              buttonLabel={copy?.buttonLabel}
            />
            <SocialLinks social={props.store?.social} size={16} />
          </div>
        }
        columns={footerColumns(props)}
      />
      {Bottom(props)}
    </FooterShell>
  );
}

/**
 * **Centered** — a single stack, so it cannot leave a gap on the right because
 * it has no right. Group titles are dropped and every link joins one row: this
 * is the layout for a shop with a handful of CMS pages and no link groups yet,
 * which is every shop on its first day.
 */
export function SimpleFooter(props: FooterProps) {
  const links = footerColumns(props).flatMap((c) => c.links);

  return (
    <FooterShell footerStyle={props.footerStyle} pad={{ top: 30, bottom: 24 }}>
      <div className="sf-footer-centered">
        <Link href={storeHref(props.base)} style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Brand
            name={props.name}
            logo={props.logo}
            markSize={props.logoHeight ? props.logoHeight - 4 : 30}
            nameSize={16}
          />
        </Link>

        <p style={{ ...footerBlurb, maxWidth: 460 }}>{props.blurb}</p>

        {links.length > 0 ? (
          <nav style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px" }}>
            {links.map((l) => (
              <FooterAnchor key={l.key} item={l} className="" style={footerLink} />
            ))}
          </nav>
        ) : null}

        <FooterCallLine phone={props.phone} t={props.t} />
        <SocialLinks social={props.store?.social} size={16} />
        {/* No `<PaymentBadges>` here — the bottom bar carries them for every
            layout now, and rendering them twice is what this stack did on the
            first browser pass. */}
        {Bottom(props, true)}
      </div>
    </FooterShell>
  );
}
