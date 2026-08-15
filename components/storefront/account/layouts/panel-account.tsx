"use client";
// coding-standard: maintained

import { useState } from "react";
import type { ShopperProfile } from "@/lib/storefront-client";
import { Icon } from "@/components/storefront/sf-icons";
import { AccountContent } from "@/components/storefront/account/account-content";
import { VerifyEmailBanner } from "@/components/storefront/account/verify-email-banner";
import {
  ACCOUNT_TABS,
  type AccountAreaApi,
} from "@/components/storefront/account/use-account-area";

/**
 * Panel — a menu of large section cards you **drill into**, with a Back link out.
 * No persistent nav at all.
 *
 * The calm answer, drawn for the pharmacy: one decision per screen, targets big
 * enough to hit without aiming, and each card carrying the sentence that says
 * what the section is for. A shopper managing a prescription is not navigating
 * an app, they are answering one question at a time — and an older customer on a
 * phone reaches this far more reliably than a 13px tab bar.
 *
 * This is the layout that could not have been a variant of the others: it has a
 * **different number of screens**, and the menu IS the content until you pick.
 */
export function PanelAccount({
  api,
  shopper,
}: {
  api: AccountAreaApi;
  shopper: ShopperProfile;
}) {
  const { t, activeKey, setTab, deepLinked, memberYear, signOut, initial } = api;

  // Drilled state is this layout's alone — the other three have no such screen,
  // so it does not belong in the shared hook.
  //
  // `null` means "the shopper has not chosen yet", which is why this is not a
  // plain boolean: until they do, the answer is whatever the URL said, and
  // "Track this order" from checkout must land on the tracking section rather
  // than on the menu. Deriving it beats an effect that flips a boolean — that
  // form is a `react-hooks/set-state-in-effect` error, and it would also render
  // the menu for one frame before correcting itself.
  const [chose, setChose] = useState<boolean | null>(null);
  const drilled = chose ?? deepLinked;

  const active = ACCOUNT_TABS.find((x) => x.key === activeKey);

  const open = (key: (typeof ACCOUNT_TABS)[number]["key"]) => {
    setTab(key);
    setChose(true);
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", width: "100%", padding: "22px var(--pad) 44px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--radius-md)",
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
            fontWeight: 700,
            background: "var(--primary-soft)",
            color: "var(--primary)",
          }}
        >
          {initial}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            {shopper.name}
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
            {t.memberSince} {memberYear}
          </div>
        </div>
      </div>

      {!shopper.emailVerified ? <VerifyEmailBanner /> : null}

      {drilled ? (
        <>
          <button
            type="button"
            onClick={() => setChose(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "none",
              border: "none",
              padding: "0 0 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Icon name="back" size={16} />
            {t.myAccount}
          </button>
          {active ? (
            <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.02em" }}>
              {t[active.label] as string}
            </h2>
          ) : null}
          <AccountContent api={api} shopper={shopper} />
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--gap)" }}>
            {ACCOUNT_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                data-tab={item.key}
                onClick={() => open(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "17px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--text)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    flex: "none",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                  }}
                >
                  <Icon name={item.icon} size={20} />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>
                    {t[item.label] as string}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--muted)", lineHeight: 1.35 }}>
                    {t[item.desc] as string}
                  </span>
                </span>
                <span style={{ flex: "none", color: "var(--faint)", display: "flex" }}>
                  <Icon name="chevR" size={18} />
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={signOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              marginTop: "var(--gap)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "14px",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--muted)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Icon name="logOut" size={16} />
            {t.logout}
          </button>
        </>
      )}
    </div>
  );
}
