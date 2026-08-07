"use client";
// coding-standard: maintained

import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { storefrontApi } from "@/lib/storefront-client";
import { useStoreContext } from "@/services/storefront/store-context";
import { isValidBdPhone } from "@/services/storefront/bd-phone";
import { storeHref } from "@/lib/storefront-links";

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
 */

const wrap: CSSProperties = {
  maxWidth: 460,
  margin: "0 auto",
  width: "100%",
  padding: "28px var(--pad) 40px",
};

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
  const { slug, base } = useStoreContext();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await storefrontApi.lookupOrder(slug, orderNumber.trim(), phone.trim());
      // The lookup only proves the pair matches; the token route is the canonical
      // surface, so send them there via the order number they just proved.
      router.push(
        storeHref(
          base,
          `/orders/track/result?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`,
        ),
      );
    } catch {
      // ONE message for every failure — unknown order, wrong phone, expired.
      // Distinguishing them would confirm which order numbers exist.
      setError("We couldn't find an order with those details.");
      setBusy(false);
    }
  };

  const ready = orderNumber.trim().length > 0 && isValidBdPhone(phone);

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        Look up your order
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
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
    </div>
  );
}
