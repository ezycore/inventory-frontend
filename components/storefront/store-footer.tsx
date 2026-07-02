"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type {
  ContentPageLink,
  StoreFooterGroup,
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { useStorePages } from "@/services/storefront/hooks";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { Brand } from "@/components/storefront/logo-mark";

const FOOTER_VARIANTS: readonly string[] = ["columns", "simple", "rich"];
const footerLink: CSSProperties = { fontSize: 13, color: "var(--muted)" };
const uppercaseLabel: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

type T = ReturnType<typeof useStorefrontUI>["t"];

interface FooterProps {
  base: string;
  store?: StorefrontStore;
  t: T;
  name: string;
  logo?: string;
  phone: string;
  footerGroups: StoreFooterGroup[];
  infoPages: ContentPageLink[];
}

/**
 * Storefront footer — renders one of three admin-selectable variants
 * (Columns / Simple / Rich) from `templates.footer`. Reads the live preview
 * override (admin Customize editor) first so switching repaints instantly, the
 * same way the home template does.
 */
export function StoreFooter({
  slug,
  base,
  store,
}: {
  slug: string;
  base: string;
  store?: StorefrontStore;
}) {
  const { t } = useStorefrontUI();
  const { data: pages } = useStorePages(slug);
  const previewFooter = useSfPreview((s) => s.footer);

  const variant: StoreTemplates["footer"] = FOOTER_VARIANTS.includes(
    previewFooter ?? "",
  )
    ? (previewFooter as StoreTemplates["footer"])
    : resolveTemplates(store).footer;

  const props: FooterProps = {
    base,
    store,
    t,
    name: store?.name ?? "Store",
    logo: store?.logo?.url || store?.logo?.thumbnailUrl,
    phone: store?.contact?.phone ?? "",
    footerGroups: store?.nav?.footer ?? [],
    infoPages: pages ?? [],
  };

  if (variant === "simple") return <SimpleFooter {...props} />;
  if (variant === "rich") return <RichFooter {...props} />;
  return <ColumnsFooter {...props} />;
}

/* -------------------------------- variants -------------------------------- */

function ColumnsFooter(props: FooterProps) {
  return (
    <FooterShell>
      <ColumnsBlock {...props} />
      <BottomBar name={props.name} currency={props.store?.currency} t={props.t} />
    </FooterShell>
  );
}

function SimpleFooter(props: FooterProps) {
  const links: { key: string; label: string; href: string; external: boolean }[] = [
    ...props.footerGroups.flatMap((g) =>
      g.links.map((lk) => ({
        key: `${g.title}:${lk.label}`,
        label: lk.label,
        href: lk.url || "#",
        external: true,
      })),
    ),
    ...props.infoPages.map((pg) => ({
      key: pg._id,
      label: pg.title,
      href: storeHref(props.base, `/pages/${pg.slug}`),
      external: false,
    })),
  ];

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
        <Link href={storeHref(props.base)} style={{ display: "flex", alignItems: "center", gap: 9 }}>
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
      <BottomBar name={props.name} currency={props.store?.currency} t={props.t} />
    </FooterShell>
  );
}

function RichFooter(props: FooterProps) {
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
    return text
      ? { icon: (saved[i].icon as IconName) || d.icon, label: text }
      : d;
  });
  const social = props.store?.social ?? {};
  const socialLinks = (
    [
      social.facebook ? { label: "Facebook", href: social.facebook } : null,
      social.instagram ? { label: "Instagram", href: social.instagram } : null,
      social.whatsapp ? { label: "WhatsApp", href: social.whatsapp } : null,
    ].filter(Boolean) as { label: string; href: string }[]
  );

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

      <ColumnsBlock {...props} />

      {socialLinks.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{t.followUs}</span>
          {socialLinks.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={footerLink}>
              {s.label}
            </a>
          ))}
        </div>
      ) : null}

      <BottomBar name={props.name} currency={props.store?.currency} t={t} />
    </FooterShell>
  );
}

/* ------------------------------ shared pieces ----------------------------- */

function FooterShell({
  children,
  pad = "36px var(--pad) 28px",
}: {
  children: ReactNode;
  pad?: string;
}) {
  return (
    <footer style={{ background: "var(--card)", borderTop: "1px solid var(--border)", marginTop: 20 }}>
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: pad }}>
        {children}
      </div>
    </footer>
  );
}

function ColumnsBlock(props: FooterProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "var(--footcols)",
        gap: 28,
        marginBottom: 28,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <Brand name={props.name} logo={props.logo} markSize={31} nameSize={16} />
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
          {props.store?.theme?.footerText ?? props.t.storeInfo}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Merchant-configured footer groups (Navigation → Footer). */}
        {props.footerGroups.map((g) => (
          <FooterGroup key={g.title} title={g.title}>
            {g.links.map((lk) => (
              <a key={lk.label} href={lk.url || "#"} style={footerLink}>
                {lk.label}
              </a>
            ))}
          </FooterGroup>
        ))}
        {/* Published "Show in footer" content pages (Ecommerce → Content). */}
        {props.infoPages.length > 0 ? (
          <FooterGroup title={props.t.information}>
            {props.infoPages.map((pg) => (
              <Link key={pg._id} href={storeHref(props.base, `/pages/${pg.slug}`)} style={footerLink}>
                {pg.title}
              </Link>
            ))}
          </FooterGroup>
        ) : null}
      </div>

      <div>
        <div style={{ ...uppercaseLabel, marginBottom: 11 }}>{props.t.weAccept}</div>
        <PaymentBadges store={props.store} t={props.t} />
        {props.phone ? (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--muted)" }}>
            <Icon name="phone" size={15} /> {props.t.callUs} {props.phone}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={uppercaseLabel}>{title}</div>
      {children}
    </div>
  );
}

function PaymentBadges({ store, t }: { store?: StorefrontStore; t: T }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {(store?.allowedPaymentMethods ?? ["cod", "bank"]).map((m) => (
        <span
          key={m}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 7 }}
        >
          {m === "cod" ? t.cod : t.bankTransfer}
        </span>
      ))}
    </div>
  );
}

function BottomBar({ name, currency, t }: { name: string; currency?: string; t: T }) {
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
