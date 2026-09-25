"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { StoreFooterBlock } from "@/lib/storefront-client";
import { footerLinkTarget } from "@/lib/storefront-footer/links";
import type { FooterImage } from "@/lib/storefront-footer/types";
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import { RichDocView } from "@/components/storefront/rich-doc-view";
import { SocialLinks } from "@/components/storefront/social-links";
import { FooterContactCard } from "@/components/storefront/footer/footer-contact-card";
import { FooterNewsletter } from "@/components/storefront/footer/footer-newsletter";
import {
  contentPagesColumn,
  groupLinks,
  type FooterProps,
} from "@/components/storefront/footer/footer-model";
import {
  FooterBrand,
  FooterCallLine,
  FooterCol,
  FooterPromises,
} from "@/components/storefront/footer/footer-pieces";

/**
 * One view per footer block type. Every string drawn is the merchant's or a
 * localized default — the rule `FooterProps` states for the layouts holds for
 * blocks too — and a block with nothing to show renders nothing rather than an
 * empty box.
 */

interface BlockViewProps {
  block: StoreFooterBlock;
  props: FooterProps;
  /** Phone accordion start state for a link-type block. */
  startsOpen: boolean;
}

const headingStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function BlockHeading({ title }: { title?: string }) {
  return title?.trim() ? <p style={headingStyle}>{title}</p> : null;
}

const srcOf = (image?: FooterImage | null) => image?.mediumUrl || image?.url;

/**
 * Wrap in a link when the merchant gave one — resolved like every footer link.
 * A logo or picture usually points at a partner's site, so an absolute link
 * opens a new tab; an in-shop path stays a client-side `<Link>`.
 */
function MaybeLink({
  url,
  label,
  props,
  children,
}: {
  url?: string;
  label: string;
  props: FooterProps;
  children: ReactNode;
}) {
  const target = url?.trim()
    ? footerLinkTarget(props.base, { label, type: "url", value: url, newTab: true }, props.categories)
    : null;
  if (!target) return <>{children}</>;
  const style: CSSProperties = { display: "inline-flex" };
  if (!target.external) {
    return (
      <Link href={target.href} aria-label={label || undefined} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={target.href}
      aria-label={label || undefined}
      style={style}
      {...(target.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function BrandBlock({ block, props }: BlockViewProps) {
  return (
    <div className="sf-fb-stack">
      <FooterBrand
        name={props.name}
        logo={props.logo}
        logoHeight={props.logoHeight}
        blurb={block.showAbout === false ? undefined : props.blurb}
      />
      {block.showPhone === false ? null : <FooterCallLine phone={props.phone} t={props.t} />}
      {block.showSocial === false ? null : <SocialLinks social={props.store?.social} size={16} />}
    </div>
  );
}

function LinksBlock({ block, props, startsOpen }: BlockViewProps) {
  const links = groupLinks(
    { title: block.title ?? "", links: block.links ?? [] },
    props.base,
    props.categories,
    block.id,
  );
  if (!links.length) return null;
  return (
    <FooterCol
      column={{ key: block.id, title: block.title ?? "", links }}
      defaultOpen={startsOpen}
    />
  );
}

function PagesBlock({ block, props, startsOpen }: BlockViewProps) {
  const column = contentPagesColumn(
    props.infoPages,
    { title: block.title || props.footerContentPages?.title },
    props.base,
    props.t.information,
  );
  return column ? <FooterCol column={column} defaultOpen={startsOpen} /> : null;
}

function ContactBlock({ props }: BlockViewProps) {
  return (
    <FooterContactCard
      store={props.store}
      base={props.base}
      t={props.t}
      heading={props.contactHeading}
      phone={props.phone}
    />
  );
}

function NewsletterBlock({ props }: BlockViewProps) {
  return (
    <FooterNewsletter
      slug={props.slug}
      t={props.t}
      heading={props.newsletter?.heading}
      blurb={props.newsletter?.blurb}
      buttonLabel={props.newsletter?.buttonLabel}
    />
  );
}

function TextBlock({ block }: BlockViewProps) {
  const doc = parseRichDoc(block.body);
  if (!doc && !block.title?.trim()) return null;
  return (
    <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
      <BlockHeading title={block.title} />
      {doc ? <RichDocView doc={doc} /> : null}
    </div>
  );
}

function ImageBlock({ block, props }: BlockViewProps) {
  const src = srcOf(block.image);
  if (!src) return null;
  return (
    <MaybeLink url={block.url} label={block.alt ?? ""} props={props}>
      {/* eslint-disable-next-line @next/next/no-img-element -- merchant upload of unknown size, drawn as-is */}
      <img
        src={src}
        alt={block.alt ?? ""}
        loading="lazy"
        style={{ display: "block", width: "100%", height: "auto", maxWidth: block.maxWidth ?? 240 }}
      />
    </MaybeLink>
  );
}

/** Default logo height — tall enough to read a payment mark, short enough for a row of eight. */
const LOGO_HEIGHT = 28;

function LogosBlock({ block, props }: BlockViewProps) {
  const logos = (block.logos ?? []).filter((logo) => srcOf(logo.image));
  if (!logos.length) return null;
  const height = block.logoHeight ?? LOGO_HEIGHT;
  return (
    <div>
      <BlockHeading title={block.title} />
      <ul className="sf-fb-logos">
        {logos.map((logo, i) => (
          <li key={`${srcOf(logo.image)}:${i}`}>
            <MaybeLink url={logo.url} label={logo.alt} props={props}>
              {/* eslint-disable-next-line @next/next/no-img-element -- merchant upload, never cropped */}
              <img
                src={srcOf(logo.image)}
                alt={logo.alt}
                loading="lazy"
                style={{ display: "block", height, width: "auto", maxWidth: height * 4, objectFit: "contain" }}
              />
            </MaybeLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialBlock({ block, props }: BlockViewProps) {
  return (
    <div className="sf-fb-stack">
      <BlockHeading title={block.title} />
      <SocialLinks social={props.store?.social} size={16} />
    </div>
  );
}

const VIEWS: Record<StoreFooterBlock["type"], (p: BlockViewProps) => ReactNode> = {
  brand: BrandBlock,
  links: LinksBlock,
  pages: PagesBlock,
  contact: ContactBlock,
  newsletter: NewsletterBlock,
  promises: ({ props }) => <FooterPromises promises={props.promises} />,
  text: TextBlock,
  image: ImageBlock,
  logos: LogosBlock,
  social: SocialBlock,
};

export function FooterBlockView(p: BlockViewProps) {
  const View = VIEWS[p.block.type];
  return View ? <View {...p} /> : null;
}
