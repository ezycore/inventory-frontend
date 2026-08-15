"use client";
// coding-standard: maintained

import type { ShopperProfile } from "@/lib/storefront-client";
import { AccountContent } from "@/components/storefront/account/account-content";
import { VerifyEmailBanner } from "@/components/storefront/account/verify-email-banner";
import {
  ACCOUNT_TABS,
  type AccountAreaApi,
} from "@/components/storefront/account/use-account-area";

/**
 * Editorial — a wide-tracked text nav under a hairline, no cards, no icons, no
 * avatar. The boutique answer.
 *
 * Every other layout draws a container around the shopper: a bordered sidebar, a
 * brand banner, a grid of cards. This one draws nothing. The account area of a
 * boutique should feel like the rest of the boutique — type, rules and space —
 * and a coloured avatar disc with an initial in it is the single most "SaaS
 * dashboard" object on the page, which is why it is the first thing to go.
 *
 * The nav is horizontal and uppercase, matching the `boutique` header's menu
 * row, so the account area reads as the same shop rather than a bolted-on app.
 */
export function EditorialAccount({
  api,
  shopper,
}: {
  api: AccountAreaApi;
  shopper: ShopperProfile;
}) {
  const { t, activeKey, setTab, tabsRef, memberYear, signOut } = api;
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", width: "100%", padding: "clamp(26px,4vw,48px) var(--pad) 56px" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, marginBottom: 8 }}>
          {t.myAccount}
        </div>
        <h1 style={{ fontSize: "var(--h1)", fontWeight: 400, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {shopper.name}
        </h1>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
          {t.memberSince} {memberYear}
        </div>
      </div>

      {!shopper.emailVerified ? <VerifyEmailBanner /> : null}

      {/* Hairlines above and below, exactly like the boutique header's nav row —
          the only chrome this layout allows itself. */}
      <nav
        ref={tabsRef}
        aria-label={t.myAccount}
        className="sf-acct-tabbar"
        style={{
          display: "flex",
          gap: "clamp(18px,3vw,38px)",
          overflowX: "auto",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "13px 0",
          marginBottom: 30,
        }}
      >
        {ACCOUNT_TABS.map((item) => {
          const on = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              data-tab={item.key}
              aria-current={on ? "page" : undefined}
              onClick={() => setTab(item.key)}
              style={{
                flex: "none",
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: on ? "var(--text)" : "var(--muted)",
                textDecoration: on ? "underline" : "none",
                textUnderlineOffset: 6,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {t[item.label] as string}
            </button>
          );
        })}
        <button
          type="button"
          onClick={signOut}
          style={{
            flex: "none",
            marginInlineStart: "auto",
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--faint)",
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {t.logout}
        </button>
      </nav>

      <AccountContent api={api} shopper={shopper} />
    </div>
  );
}
