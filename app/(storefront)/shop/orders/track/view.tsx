"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type FormEvent } from "react";
import { storefrontApi, type TrackedOrder } from "@/lib/storefront-client";
import { useStoreContext } from "@/services/storefront/store-context";
import { isValidBdPhone } from "@/services/storefront/bd-phone";
import { ContentFrame } from "@/components/storefront/content-frame";
import { TrackedOrderPanel } from "@/components/storefront/tracked-order-panel";

/**
 * The recovery path for a buyer who lost their tracking link.
 *
 * **Both fields are required, and the phone is the security half.** Order numbers
 * are sequential per store, so a number-only lookup would be an enumeration key
 * over every buyer's name, area and order history. The server enforces this too —
 * this form just avoids a pointless round-trip.
 *
 * Deliberately linked from the footer rather than the main flow: the tracking link
 * is the primary surface, and this exists for the case where it was deleted.
 *
 * **The order renders here, in place.** This form used to push to
 * `/orders/track/result` — a route that has never existed — so every successful
 * lookup ended in a 404, on the one screen a guest who lost their link has left
 * (QA-N12). Redirecting to the canonical token route is not available as a fix:
 * `trackedOrderDto` withholds `trackToken` on purpose, and widening the allowlist
 * to put a live credential in the URL bar would be a worse trade than sharing a
 * component. The lookup response IS the tracked order, so it is what we show.
 */

const input: CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
};

export default function View() {
  const { slug } = useStoreContext();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      setOrder(await storefrontApi.lookupOrder(slug, orderNumber.trim(), phone.trim()));
    } catch {
      // ONE message for every failure — unknown order, wrong phone, expired.
      // Distinguishing them would confirm which order numbers exist.
      setError("We couldn't find an order with those details.");
    } finally {
      setBusy(false);
    }
  };

  // The same screen the tracking link opens. Nothing here is re-fetched or
  // polled: the buyer proved the pair once, and a background refetch on an
  // unauthenticated route is a lookup nobody asked for.
  if (order) return <TrackedOrderPanel order={order} />;

  const ready = orderNumber.trim().length > 0 && isValidBdPhone(phone);

  // The frame is the theme's (four of them, see ContentFrame); the form is not.
  return (
    <ContentFrame title="Look up your order">
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18, marginTop: 0 }}>
        Enter your order number and the phone number you ordered with.
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          style={input}
          placeholder="Order number"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <input
          style={input}
          placeholder="Phone number"
          value={phone}
          inputMode="tel"
          onChange={(e) => setPhone(e.target.value)}
        />
        {error ? (
          <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>
        ) : null}
        <button
          type="submit"
          disabled={!ready || busy}
          style={{
            padding: "11px 14px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "var(--accent-contrast, #fff)",
            fontSize: 14,
            cursor: ready && !busy ? "pointer" : "default",
            opacity: ready && !busy ? 1 : 0.6,
          }}
        >
          {busy ? "…" : "Find my order"}
        </button>
      </form>
    </ContentFrame>
  );
}
