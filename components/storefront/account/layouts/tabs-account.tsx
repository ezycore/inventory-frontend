"use client";
// coding-standard: maintained

import type { ShopperProfile } from "@/lib/storefront-client";
import { Icon } from "@/components/storefront/sf-icons";
import { AccountContent } from "@/components/storefront/account/account-content";
import { VerifyEmailBanner } from "@/components/storefront/account/verify-email-banner";
import {
  ACCOUNT_TABS,
  type AccountAreaApi,
} from "@/components/storefront/account/use-account-area";

/**
 * Tabs — a brand-coloured identity banner over a full-width underlined tab bar,
 * with the content running the whole page width beneath.
 *
 * The quick-commerce answer, and the opposite trade from `sidebar`: a shopper
 * who reorders groceries lives in Orders, so the layout spends its width on the
 * order list rather than on a 260px column of section names they already know.
 * The same shape works on a phone without collapsing into anything — the bar
 * simply scrolls, which is why `tabsRef` matters most here.
 */
export function TabsAccount({
  api,
  shopper,
}: {
  api: AccountAreaApi;
  shopper: ShopperProfile;
}) {
  const { t, activeKey, setTab, tabsRef, memberYear, signOut, initial } = api;
  return (
    <div style={{ width: "100%" }}>
      {/* Full-bleed banner: the brand colour is the page's ground here rather
          than a card's border, which is what makes this read as a different
          site from the sidebar even before the nav shape registers. */}
      <div style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
        <div style={{ maxWidth: "var(--maxw-read)", margin: "0 auto", padding: "clamp(18px,3vw,30px) var(--pad)", display: "flex", alignItems: "center", gap: 15 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              flex: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              background: "rgba(255,255,255,0.18)",
              color: "var(--on-primary)",
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "var(--h2)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shopper.name}
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85 }}>
              {t.memberSince} {memberYear}
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flex: "none",
              background: "rgba(255,255,255,0.16)",
              color: "var(--on-primary)",
              border: "none",
              borderRadius: 999,
              padding: "9px 16px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Icon name="logOut" size={15} />
            {t.logout}
          </button>
        </div>
      </div>

      {/* Sticky tab bar. `sf-acct-tabbar` only carries the scrollbar hiding —
          everything visual is inline against the storefront vars, like the rest
          of this design system. */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 4 }}>
        <nav
          ref={tabsRef}
          aria-label={t.myAccount}
          className="sf-acct-tabbar"
          style={{ maxWidth: "var(--maxw-read)", margin: "0 auto", padding: "0 var(--pad)", display: "flex", gap: 4, overflowX: "auto" }}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: "none",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${on ? "var(--primary)" : "transparent"}`,
                  color: on ? "var(--primary)" : "var(--muted)",
                  padding: "14px 14px 12px",
                  fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon name={item.icon} size={16} />
                {t[item.label] as string}
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ maxWidth: "var(--maxw-read)", margin: "0 auto", width: "100%", padding: "20px var(--pad) 40px" }}>
        {!shopper.emailVerified ? <VerifyEmailBanner /> : null}
        <AccountContent api={api} shopper={shopper} />
      </div>
    </div>
  );
}
