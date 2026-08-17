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
 * Sidebar — a sticky identity + section column beside the content.
 *
 * **This is the storefront's original account area, unchanged**, which is why
 * it is the default and why Classic stamps it: a shop that has never opened
 * Themes must render exactly what it rendered before layouts existed. Its CSS
 * (`.sf-account-nav` / `.sf-acct-*` in storefront.css) collapses it to a compact
 * identity row and a scrolling chip strip below 680px.
 */
export function SidebarAccount({
  api,
  shopper,
}: {
  api: AccountAreaApi;
  shopper: ShopperProfile;
}) {
  const { t, activeKey, setTab, tabsRef, memberYear, signOut, initial } = api;
  return (
    <div style={{ maxWidth: "var(--maxw-read)", margin: "0 auto", width: "100%", padding: "22px var(--pad) 40px" }}>
      <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
        {t.myAccount}
      </h1>
      {!shopper.emailVerified ? <VerifyEmailBanner /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "var(--acctgrid)", gap: "var(--gap)", alignItems: "start" }}>
        {/* Layout lives in storefront.css: a sticky 260px sidebar on desktop, a
            compact identity row plus a scrolling section strip below 680px,
            where --acctgrid collapses and this stacks above the content. Grid
            areas move the logout button between the two positions, so there is
            only one copy of the nav. */}
        <aside className="sf-account-nav">
          <div className="sf-acct-identity">
            <div className="sf-acct-avatar">{initial}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sf-acct-name">{shopper.name}</div>
              <div className="sf-acct-since">
                {t.memberSince} {memberYear}
              </div>
            </div>
          </div>

          <nav ref={tabsRef} className="sf-acct-tabs" aria-label={t.myAccount}>
            {ACCOUNT_TABS.map((item) => {
              const on = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-tab={item.key}
                  aria-current={on ? "page" : undefined}
                  onClick={() => setTab(item.key)}
                  className={`sf-acct-tab${on ? " is-on" : ""}`}
                >
                  <span className="sf-acct-tab-icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="sf-acct-tab-label">{t[item.label] as string}</span>
                    <span className="sf-acct-tab-desc">{t[item.desc] as string}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="sf-acct-logout">
            <button type="button" onClick={signOut} className="sf-acct-logout-btn">
              <span style={{ display: "flex", flex: "none" }}>
                <Icon name="logOut" size={16} />
              </span>
              {t.logout}
            </button>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          <AccountContent api={api} shopper={shopper} />
        </div>
      </div>
    </div>
  );
}
