"use client";
// coding-standard: maintained

import { toast } from "@/lib/storefront-toast";
import type { ShopperPrefs, ShopperProfile } from "@/lib/storefront-client";
import { useShopperAccount } from "@/services/storefront/hooks";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";

const DEFAULT_PREFS: ShopperPrefs = {
  promoEmail: true,
  priceDrop: false,
  newsletter: true,
};

type Dict = ReturnType<typeof useStorefrontUI>["t"];
const ROWS: { key: keyof ShopperPrefs; title: keyof Dict; sub: keyof Dict }[] = [
  { key: "promoEmail", title: "promoEmailT", sub: "promoEmailS" },
  { key: "priceDrop", title: "priceDropT", sub: "priceDropS" },
  { key: "newsletter", title: "newsletterT", sub: "newsletterS" },
];

/**
 * Notifications section — MARKETING consent only (optimistic toggles).
 * Order updates are deliberately absent: the store decides which order events
 * it sends and on which channel, so there is nothing here for a shopper to
 * turn off (backend docs/plan/notifications.md D2).
 */
export function PrefsSection({ shopper }: { shopper: ShopperProfile }) {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const { updatePrefs } = useShopperAccount(slug);
  const setShopper = useShopperStore((s) => s.setShopper);
  const prefs = { ...DEFAULT_PREFS, ...(shopper.prefs ?? {}) };

  const toggle = (key: keyof ShopperPrefs) => {
    // Flip locally first so the switch answers the tap instantly; the hook's
    // onSuccess replaces this with the server's authoritative profile, and a
    // failure rolls back to the pre-toggle profile.
    const prev = shopper;
    setShopper({ ...shopper, prefs: { ...prefs, [key]: !prefs[key] } });
    updatePrefs.mutate(
      { [key]: !prefs[key] },
      {
        onError: (e) => {
          setShopper(prev);
          toast.error((e as Error).message);
        },
      },
    );
  };

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" }}>{t.prefsTitle}</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 18px" }}>{t.prefsSub}</p>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "-10px 0 18px", lineHeight: 1.5 }}>
        {t.prefsOrderNote}
      </p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ROWS.map((row) => {
          const on = prefs[row.key];
          return (
            <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "15px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t[row.title] as string}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>{t[row.sub] as string}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={t[row.title] as string}
                onClick={() => toggle(row.key)}
                style={{
                  width: 42,
                  height: 24,
                  borderRadius: 999,
                  flex: "none",
                  position: "relative",
                  cursor: "pointer",
                  border: "none",
                  padding: 0,
                  transition: "background .18s",
                  background: on ? "var(--primary)" : "var(--border-strong)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: on ? 21 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left .18s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
