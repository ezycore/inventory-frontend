"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { Brand } from "@/components/storefront/logo-mark";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import {
  HeaderSearchBar,
  HeaderSearchIcon,
} from "@/components/storefront/header-search";
import {
  AccountLink,
  CartButton,
  CategoryRow,
  LangBtn,
  ThemeBtn,
  UtilityBar,
  headerLinks,
  type HeaderCtx,
} from "@/components/storefront/header/header-shared";

/**
 * The desktop header anatomies.
 *
 * The header is the first thing a shopper sees and the loudest signal of what
 * kind of shop they are in, so these are genuinely different *structures* — not
 * one bar restyled. A grocery shopper needs the search box to dominate; a
 * boutique wants it out of the way entirely. Getting that wrong is most of why
 * three "different" themes can still feel like the same website.
 *
 * Adding one: add it here, add its id to `HEADER_VARIANTS` in `store-header.tsx`
 * and to `TEMPLATE_OPTIONS.header`. `templates.header` is a loose string on the
 * backend, so no contract change is needed.
 */

/** Classic — utility bar, logo, search, labelled account + cart, category row. */
export function ClassicDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo } = ctx;
  return (
    <>
      <UtilityBar ctx={ctx} />
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "13px var(--pad)", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
          <Brand name={name} logo={logo} markSize={38} nameSize={18} />
        </Link>
        <HeaderSearchBar categories={ctx.cats} />
        <div style={{ display: "flex", alignItems: "center", gap: 18, flex: "none" }}>
          <AccountLink ctx={ctx} withLabel />
          <CartButton ctx={ctx} withLabel />
        </div>
      </div>
      <CategoryRow ctx={ctx} />
    </>
  );
}

/** Minimal — logo, centred link row, icons. No search field, no category row. */
export function MinimalDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo } = ctx;
  const links = headerLinks(ctx);
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "12px var(--pad)", display: "flex", alignItems: "center", gap: 24 }}>
      <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
        <Brand name={name} logo={logo} markSize={32} nameSize={17} />
      </Link>
      <nav style={{ flex: 1, display: "flex", gap: 20, overflowX: "auto", justifyContent: "center" }}>
        {links.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            /* `sf-nav-top` carries the colour and the merchant's hover choice;
               the size stays here because it is this anatomy's own. An inline
               `color` would outrank the hover rule — see the note in
               `storefront.css`. */
            className="sf-nav-top"
            style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "none" }}>
        <HeaderSearchIcon categories={ctx.cats} />
        <ThemeBtn ctx={ctx} compact />
        <AccountLink ctx={ctx} />
        <CartButton ctx={ctx} />
      </div>
    </div>
  );
}

/** Centered — toggles left, logo centred, icons right, category row below. */
export function CenteredDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo } = ctx;
  return (
    <>
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "13px var(--pad)", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--muted)" }}>
          <LangBtn ctx={ctx} />
          <ThemeBtn ctx={ctx} />
        </div>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "center" }}>
          <Brand name={name} logo={logo} markSize={34} nameSize={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18, justifySelf: "end" }}>
          <HeaderSearchIcon categories={ctx.cats} />
          <AccountLink ctx={ctx} />
          <CartButton ctx={ctx} />
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <CategoryRow ctx={ctx} center />
      </div>
    </>
  );
}

/**
 * Search-first — the quick-commerce bar: a pill search flanked by a delivery
 * promise and a filled cart button.
 *
 * **It used to be a solid brand-coloured band and that is exactly what looked
 * cheap** — using the brand as a *surface* made the loudest thing on the page a
 * rectangle, and it flattened the merchant's own logo against it. The brand now
 * appears only where the eye should go: the cart, and the tint behind the
 * delivery chip.
 *
 * Distinct from Classic, which also carries a search field: no utility bar, a
 * smaller mark, a pill rather than a rounded rectangle, and no category row — a
 * shop using this pairs it with `category-tiles`, where photographs do that job
 * better than a text strip.
 */
export function SearchFirstDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo, cats, t } = ctx;
  // The merchant's first promise doubles as the delivery line ("Same-day
  // delivery"). Reusing `trustBadges` rather than adding a field means there is
  // no new empty state to design and nothing extra for an owner to fill in.
  const promise = ctx.deliveryPromise?.trim();
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "12px var(--pad)", display: "flex", alignItems: "center", gap: 16 }}>
      <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
        <Brand name={name} logo={logo} markSize={32} nameSize={17} />
      </Link>

      {promise ? (
        <span
          className="sf-desktop-only"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: "none",
            background: "var(--primary-soft)",
            color: "var(--primary)",
            borderRadius: 999,
            padding: "6px 13px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="truck" size={15} />
          {promise}
        </span>
      ) : null}

      {/* `sf-search-pill` rounds the shared search field without forking it —
          one search implementation, two shapes. */}
      <div className="sf-search-pill" style={{ flex: 1, display: "flex", minWidth: 0 }}>
        <HeaderSearchBar categories={cats} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
        <ThemeBtn ctx={ctx} compact />
        <AccountLink ctx={ctx} />
        <button
          type="button"
          onClick={ctx.goCart}
          aria-label={t.cart}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--primary)",
            color: "var(--on-primary)",
            border: "none",
            borderRadius: 999,
            padding: "9px 17px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="cart" size={17} />
          {/* Count AND subtotal, not a bare number. A shopper filling a weekly
              basket watches the running total — it is the single most useful
              thing this header can carry, and "2" answers a question nobody
              asked. Subtotal only: shipping needs a district they have not
              picked, so a bigger number here would be contradicted at checkout. */}
          {ctx.cartCount > 0
            ? `${ctx.cartCount} · ${money(ctx.cartSubtotal, ctx.currency)}`
            : t.cart}
        </button>
      </div>
    </div>
  );
}

/**
 * Boutique — wordmark and a hairline search on one row, the menu on its own row
 * beneath.
 *
 * The editorial anatomy, and it **does** carry a real search field. An earlier
 * version hid search behind an icon because that is the luxury-brand convention;
 * that is a bad trade for a shop with two hundred sarees, whose customers type
 * "jamdani". The differentiation is the *treatment* — a rule instead of a box —
 * not the absence of a control someone needs.
 */
export function BoutiqueDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo, cats } = ctx;
  const links = headerLinks(ctx);
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "16px var(--pad) 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
          <Brand name={name} logo={logo} markSize={34} nameSize={21} />
        </Link>
        <div className="sf-search-rule" style={{ flex: 1, display: "flex", minWidth: 0 }}>
          <HeaderSearchBar categories={cats} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 17, flex: "none" }}>
          <ThemeBtn ctx={ctx} compact />
          <AccountLink ctx={ctx} />
          <CartButton ctx={ctx} />
        </div>
      </div>
      <nav
        style={{
          display: "flex",
          gap: "clamp(16px,2.6vw,32px)",
          flexWrap: "wrap",
          padding: "14px 0 12px",
        }}
      >
        {links.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            /* The tracking and the uppercasing ARE this anatomy, so they stay
               inline; only the colour moves, because inline it would outrank
               the merchant's hover rule. */
            className="sf-nav-top"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/**
 * Clinical — logo, a wide search field, and the icons. No utility bar, no
 * category row, no fill.
 *
 * Drawn for the pharmacy, and it exists because `classic` was standing in for
 * it: a shopper here arrives with a name to type ("Napa", "omeprazole"), so the
 * search field has to be the widest thing on the bar — but the shop also opens
 * on a trust band that does the wayfinding, which makes Classic's category row
 * redundant and its utility strip noise.
 *
 * Distinct from `search-first`, which is the other search-led anatomy: that one
 * is a pill with a filled cart button and a delivery chip, sized for someone
 * assembling a thirty-line basket. This is a plain rounded field, a taller bar
 * and more air — the difference between "find it fast" and "read it carefully".
 */
export function ClinicalDesktop({ ctx }: { ctx: HeaderCtx }) {
  const { base, name, logo, cats } = ctx;
  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "16px var(--pad)", display: "flex", alignItems: "center", gap: "clamp(16px,2.4vw,32px)" }}>
      <Link href={storeHref(base)} style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
        <Brand name={name} logo={logo} markSize={34} nameSize={18} />
      </Link>

      <div style={{ flex: 1, display: "flex", minWidth: 0, maxWidth: 620 }}>
        <HeaderSearchBar categories={cats} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, flex: "none", marginInlineStart: "auto" }}>
        <LangBtn ctx={ctx} />
        <ThemeBtn ctx={ctx} />
        <AccountLink ctx={ctx} />
        <CartButton ctx={ctx} />
      </div>
    </div>
  );
}
