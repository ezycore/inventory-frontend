"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { SocialLinks } from "@/components/storefront/social-links";
import { Brand } from "@/components/storefront/logo-mark";
import {
  BottomBar,
  FooterBrand,
  FooterColumns,
  FooterPayments,
  FooterShell,
  PaymentBadges,
  footerColumns,
  footerLink,
  type FooterProps,
} from "@/components/storefront/footer/footer-pieces";

/** Brand + one column per group + content-pages column + payments aside. */
function ColumnsBody(props: FooterProps) {
  return (
    <FooterColumns
      brand={
        <FooterBrand
          name={props.name}
          logo={props.logo}
          blurb={props.store?.theme?.footerText ?? props.t.storeInfo}
        />
      }
      columns={footerColumns(props)}
      aside={<FooterPayments store={props.store} t={props.t} phone={props.phone} />}
    />
  );
}

export function ColumnsFooter(props: FooterProps) {
  return (
    <FooterShell>
      <ColumnsBody {...props} />
      <SocialLinks
        social={props.store?.social}
        label={props.t.followUs}
        style={{ paddingBottom: 20 }}
      />
      <BottomBar name={props.name} currency={props.store?.currency} t={props.t} />
    </FooterShell>
  );
}

export function RichFooter(props: FooterProps) {
  const { t } = props;
  // Owner-editable badges (live draft wins) with PER-SLOT fallback: each of the
  // three slots keeps its built-in localized default until the owner sets text.
  const previewBadges = useSfPreview((s) => s.badges);
  const saved = previewBadges ?? props.store?.trustBadges ?? [];
  const defaults: { icon: IconName; label: string }[] = [
    { icon: "shield", label: t.genuine },
    { icon: "truck", label: t.fastDelivery },
    { icon: "coins", label: t.codBadge },
  ];
  const trust = defaults.map((d, i) => {
    const text = saved[i]?.text?.trim();
    return text ? { icon: (saved[i].icon as IconName) || d.icon, label: text } : d;
  });

  return (
    <FooterShell>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(var(--trustcols), minmax(0,1fr))",
          gap: "var(--gap)",
          paddingBottom: 24,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {trust.map((tr) => (
          <div key={tr.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--primary)" }}>
              <Icon name={tr.icon} size={20} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{tr.label}</span>
          </div>
        ))}
      </div>

      <ColumnsBody {...props} />

      <SocialLinks social={props.store?.social} label={t.followUs} style={{ paddingBottom: 20 }} />

      <BottomBar name={props.name} currency={props.store?.currency} t={t} />
    </FooterShell>
  );
}

/**
 * Deliberately minimal: brand + a single flat row of links (group titles are
 * not shown — that is what Columns / Rich are for), payment badges, socials and
 * the copyright line. Respects the content-pages show toggle like the others.
 */
export function SimpleFooter(props: FooterProps) {
  const links = footerColumns(props).flatMap((c) => c.links);

  return (
    <FooterShell pad="24px var(--pad)">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <Link
          href={storeHref(props.base)}
          style={{ display: "flex", alignItems: "center", gap: 9 }}
        >
          <Brand name={props.name} logo={props.logo} markSize={28} nameSize={15} />
        </Link>
        {links.length > 0 ? (
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {links.map((l) =>
              l.external ? (
                <a key={l.key} href={l.href} style={footerLink}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.key} href={l.href} style={footerLink}>
                  {l.label}
                </Link>
              ),
            )}
          </nav>
        ) : null}
        <PaymentBadges store={props.store} t={props.t} />
      </div>
      <SocialLinks social={props.store?.social} style={{ paddingBottom: 14 }} />
      <BottomBar name={props.name} currency={props.store?.currency} t={props.t} />
    </FooterShell>
  );
}
