"use client";
// coding-standard: maintained

import Image from "next/image";
import { BarChart3, Package, ShieldCheck, Store, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import { BRAND } from "@/constants/brand";

/**
 * What a new merchant is told the product does, on the one screen where they
 * have not seen it yet. The online store leads: it is the capability they are
 * least likely to expect from an inventory tool, and the one that changes what
 * their business can do.
 *
 * Only the icon and the message-key stem live here — both components below
 * bind their own `t`, since a plain function called during render cannot.
 */
const SIGNUP_HIGHLIGHTS = [
  { icon: Store, key: "store" },
  { icon: Package, key: "stock" },
  { icon: Truck, key: "courier" },
  { icon: BarChart3, key: "reports" },
  { icon: ShieldCheck, key: "security" },
] as const;

/** How many highlights the mobile strip can carry without wrapping past a line or two. */
const MOBILE_HIGHLIGHT_COUNT = 3;

/**
 * The dark pitch panel beside the signup form. Hidden below `lg` — see
 * `SignupHighlightStrip` for what phone-width signups get instead.
 */
export function SignupBrandPanel() {
  const t = useTranslations("auth.signup");
  const tHighlight = useTranslations("auth.signup.highlights");

  return (
    // Gradient runs the logo palette itself — brand green (#0E8F73) into the
    // mark's two navies — so the inverse logo mark sits on its own colours.
    // Fixed hexes, not theme tokens: this panel is always a dark surface.
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0E8F73] via-[#16335E] to-[#0A1A33] p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:gap-8">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#34D2AE]/20 blur-3xl" />

      <div className="relative flex items-center gap-2.5">
        <Image
          src="/logo/ezycore-mark-inverse.svg"
          alt=""
          width={30}
          height={30}
        />
        <span className="text-lg font-semibold tracking-tight">
          {BRAND.name}
        </span>
      </div>

      <div className="relative space-y-3">
        <h2 className="max-w-[15ch] text-3xl font-bold leading-[1.14] tracking-tight xl:text-4xl">
          {t("panelHeadline")}
        </h2>
        <p className="max-w-sm text-sm text-white/75">{t("panelSubhead")}</p>
      </div>

      {/* Pushed to the bottom so the pitch reads first and the panel has no
          dead band in the middle. */}
      <ul className="relative mt-auto">
        {SIGNUP_HIGHLIGHTS.map((highlight) => (
          <li
            key={highlight.key}
            className="flex items-center gap-3.5 border-t border-white/10 py-3 first:border-t-0"
          >
            <highlight.icon className="h-4 w-4 shrink-0 text-[#6FE3C4]" />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {tHighlight(`${highlight.key}Title`)}
              </p>
              <p className="text-xs text-white/60">
                {tHighlight(`${highlight.key}Description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="relative text-xs text-white/50">
        {t("panelCopyright", {
          // No organization exists yet at signup, so there is no org calendar to read.
          // eslint-disable-next-line no-restricted-syntax -- copyright year only
          year: new Date().getFullYear(),
          brand: BRAND.name,
        })}
      </p>
    </aside>
  );
}

/**
 * The panel above is desktop-only, so everything it says about the product is
 * invisible to anyone signing up on a phone — which is most of them. This
 * carries its leading claims at mobile width, from the same list.
 */
export function SignupHighlightStrip() {
  const tHighlight = useTranslations("auth.signup.highlights");

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:hidden">
      {SIGNUP_HIGHLIGHTS.slice(0, MOBILE_HIGHLIGHT_COUNT).map((highlight) => (
        <li
          key={highlight.key}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <highlight.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          {tHighlight(`${highlight.key}Title`)}
        </li>
      ))}
    </ul>
  );
}
