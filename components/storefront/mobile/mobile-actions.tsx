"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import {
  mobileAction,
  mobileIcon,
  type MobileActionId,
  type MobileChrome,
} from "@/lib/storefront-mobile";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartNav } from "@/services/storefront/use-cart-nav";

/**
 * The tappable atoms of the mobile bar and tab bar.
 *
 * One component per action id, resolved through `ACTIONS` — so a template is a
 * LIST of ids and never a tree of components, and the bar has no idea what a
 * cart is. Adding an action is an entry in `MOBILE_ACTIONS` plus an entry here;
 * adding a template is neither.
 *
 * Both surfaces render through the same atoms on purpose. Before this the bottom
 * tab bar and the header bar drew their own cart button with their own badge,
 * which is two places for the count to be wrong in.
 */

/**
 * `tapPad` — padding plus a matching negative margin. Lifts an 18–22px glyph to
 * a 42px touch target without moving it or changing the gap to its neighbour.
 * Copied in spirit from the header's own `tapPad`; kept here because the mobile
 * chrome no longer imports anything from the desktop header.
 */
const tapPad: CSSProperties = { padding: 11, margin: -11 };

const bareBtn: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  color: "var(--text)",
};

/** Everything an atom needs, assembled once per render by `MobileChromeProvider`. */
export interface MobileActionCtx {
  base: string;
  slug: string;
  chrome: MobileChrome;
  /** Opens the menu panel (drawer or sheet — the chrome decides which). */
  openMenu: () => void;
  /** Opens the full-screen search takeover. */
  openSearch: () => void;
  /** The merchant's published phone number, or "" when they have none. */
  phone: string;
  /** True on the route this action points at, for the tab bar's active state. */
  isActive: (id: MobileActionId) => boolean;
}

/* ------------------------------- primitives ------------------------------- */

/** The count bubble on the cart. Renders nothing at zero. */
function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      className="sf-mono"
      style={{
        position: "absolute",
        top: -6,
        right: -9,
        background: "var(--primary)",
        color: "var(--on-primary)",
        fontSize: 11,
        fontWeight: 700,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px",
      }}
    >
      {count}
    </span>
  );
}

/** A glyph with an optional badge — the bar's shape and the tab's top half. */
function Glyph({
  icon,
  size,
  badge,
  color,
}: {
  icon: IconName;
  size: number;
  badge?: number;
  color?: string;
}) {
  return (
    <span style={{ position: "relative", display: "flex", color }}>
      <Icon name={icon} size={size} />
      <Badge count={badge ?? 0} />
    </span>
  );
}

/**
 * One action, drawn for whichever surface asked.
 *
 * `mode` is the only difference between a bar button and a tab: same glyph, same
 * destination, same badge — a tab adds the label underneath and stretches to an
 * equal share of the bar. Splitting them into two components is how the cart
 * badge ends up on one and not the other.
 */
function Atom({
  icon,
  label,
  mode,
  active,
  badge,
  href,
  onClick,
  ariaLabel,
}: {
  icon: IconName;
  label: string;
  mode: "bar" | "tab";
  active?: boolean;
  badge?: number;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const color = mode === "tab" ? (active ? "var(--primary)" : "var(--muted)") : "var(--text)";
  const body: ReactNode =
    mode === "tab" ? (
      <>
        <Glyph icon={icon} size={22} badge={badge} color={color} />
        <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1, color }}>
          {label}
        </span>
      </>
    ) : (
      <Glyph icon={icon} size={20} badge={badge} color={color} />
    );

  const style: CSSProperties =
    mode === "tab"
      ? {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          padding: "8px 0 7px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }
      : { ...bareBtn, ...tapPad };

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        aria-label={mode === "bar" ? (ariaLabel ?? label) : undefined}
        aria-current={active ? "page" : undefined}
      >
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      aria-label={ariaLabel ?? label}
      aria-pressed={mode === "tab" ? active : undefined}
    >
      {body}
    </button>
  );
}

/* --------------------------------- atoms ---------------------------------- */

type AtomProps = { ctx: MobileActionCtx; mode: "bar" | "tab" };

const iconOf = (ctx: MobileActionCtx, id: MobileActionId) =>
  mobileIcon(ctx.chrome, id);

function MenuAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  return (
    <Atom
      icon={iconOf(ctx, "menu")}
      label={t.menu}
      mode={mode}
      active={ctx.isActive("menu")}
      onClick={ctx.openMenu}
    />
  );
}

function SearchAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  return (
    <Atom
      icon={iconOf(ctx, "search")}
      label={t.navSearch}
      ariaLabel={t.searchPh}
      mode={mode}
      onClick={ctx.openSearch}
    />
  );
}

function CartAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  const { cartCount, goCart } = useCartNav(ctx.slug);
  return (
    <Atom
      icon={iconOf(ctx, "cart")}
      label={t.navCart}
      mode={mode}
      active={ctx.isActive("cart")}
      badge={cartCount}
      onClick={goCart}
    />
  );
}

function AccountAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  return (
    <Atom
      icon={iconOf(ctx, "account")}
      label={t.navAccount}
      mode={mode}
      active={ctx.isActive("account")}
      href={storeHref(ctx.base, "/account")}
    />
  );
}

function HomeAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  return (
    <Atom
      icon={iconOf(ctx, "home")}
      label={t.navHome}
      mode={mode}
      active={ctx.isActive("home")}
      href={storeHref(ctx.base)}
    />
  );
}

function TrackAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  return (
    <Atom
      icon={iconOf(ctx, "track")}
      label={t.trackOrder}
      mode={mode}
      active={ctx.isActive("track")}
      href={storeHref(ctx.base, "/t")}
    />
  );
}

/**
 * A `tel:` link, and the one atom that can decline to render.
 *
 * A shop with no published number would otherwise draw a phone button that dials
 * nothing — see `needs: "phone"` in `MOBILE_ACTIONS`, which is also what greys
 * the row out in Customize so the merchant is told rather than left to discover
 * it on their own phone.
 */
function CallAtom({ ctx, mode }: AtomProps) {
  const { t } = useStorefrontUI();
  if (!ctx.phone) return null;
  return (
    <Atom
      icon={iconOf(ctx, "call")}
      label={t.callUs}
      mode={mode}
      href={`tel:${ctx.phone.replace(/\s+/g, "")}`}
    />
  );
}

/**
 * Language and theme — the two atoms that are WORDS on the bar, not glyphs.
 *
 * "বাংলা" says what tapping does; a globe glyph does not, and a shopper who
 * cannot read the interface is exactly the one who needs this button to be
 * unambiguous. In a TAB they get their label underneath like every other tab.
 */
function LangAtom({ ctx, mode }: AtomProps) {
  const { lang, toggleLang } = useStorefrontUI();
  const word = lang === "en" ? "বাংলা" : "EN";
  if (mode === "tab") {
    return <Atom icon={iconOf(ctx, "lang")} label={word} mode="tab" onClick={toggleLang} />;
  }
  return (
    <button
      type="button"
      onClick={toggleLang}
      style={{
        ...bareBtn,
        ...tapPad,
        fontSize: 12.5,
        color: "var(--muted)",
        fontWeight: 500,
      }}
    >
      {word}
    </button>
  );
}

function ThemeAtom({ ctx, mode }: AtomProps) {
  const { t, theme, toggleTheme } = useStorefrontUI();
  const label = theme === "dark" ? t.lightMode : t.darkMode;
  return (
    <Atom
      icon={theme === "dark" ? "sun" : "moon"}
      label={label}
      ariaLabel={label}
      mode={mode}
      onClick={toggleTheme}
    />
  );
}

/**
 * id → renderer. **The whole reason a template can be data.**
 *
 * A missing entry renders nothing rather than throwing: `resolveMobileChrome`
 * already drops ids this map does not know, so the only way to reach the
 * fallback is a registry entry added without its renderer — which should be a
 * gap in the bar during development, not a white screen on a shopper's phone.
 */
const ATOMS: Record<MobileActionId, (p: AtomProps) => ReactNode> = {
  menu: MenuAtom,
  search: SearchAtom,
  cart: CartAtom,
  account: AccountAtom,
  home: HomeAtom,
  lang: LangAtom,
  theme: ThemeAtom,
  call: CallAtom,
  track: TrackAtom,
};

export function MobileAction({
  id,
  ctx,
  mode,
}: {
  id: MobileActionId;
  ctx: MobileActionCtx;
  mode: "bar" | "tab";
}) {
  const Render = ATOMS[id];
  if (!Render || !mobileAction(id)) return null;
  return <Render ctx={ctx} mode={mode} />;
}
