"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type FormEvent } from "react";
import { storefrontApi } from "@/lib/storefront-client";
import { isSfPreview } from "@/services/storefront/cart-identity";
import type { FooterT } from "@/components/storefront/footer/footer-pieces";

/**
 * The footer sign-up block — the identity side of the `newsletter` layout.
 *
 * **Unlike every other cart-adjacent write in the storefront, this one is not
 * fire-and-forget.** The cart mirror exists for the merchant and must never
 * interrupt a shopper, so it swallows its failures; this is a form a shopper
 * pressed on purpose, and swallowing the failure would silently drop an address
 * they believe they gave us. So it awaits, disables while in flight, and says
 * what happened either way.
 *
 * Every string is the merchant's or a localized default (`heading`, `blurb`,
 * `buttonLabel` come from `copy.footerNewsletter`) — nothing here is fixed copy.
 *
 * The success message is the same whether the address was new or already on the
 * list: the server refuses to tell an anonymous caller which, because that would
 * make a public form an oracle for whether a given person shops here.
 */
export function FooterNewsletter({
  slug,
  t,
  heading,
  blurb,
  buttonLabel,
}: {
  slug: string;
  t: FooterT;
  heading?: string;
  blurb?: string;
  buttonLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state === "sending") return;

    const value = email.trim();
    // Checked here as well as server-side so the shopper is corrected without a
    // round trip; the server is still the gate (see `subscribeSchema`).
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setState("error");
      setMessage(t.footerEmailInvalid);
      return;
    }
    // A merchant theming their shop from Customize is not a subscriber — the
    // same test every cart-mirror write makes.
    if (isSfPreview()) {
      setState("done");
      setMessage(t.footerSubscribed);
      return;
    }

    setState("sending");
    try {
      await storefrontApi.subscribe(slug, value);
      setState("done");
      setMessage(t.footerSubscribed);
      setEmail("");
    } catch {
      setState("error");
      setMessage(t.footerSubscribeFailed);
    }
  };

  return (
    <div>
      <div style={{ ...headingStyle }}>{heading?.trim() || t.footerNewsletterHeading}</div>
      <p style={blurbStyle}>{blurb?.trim() || t.footerNewsletterBlurb}</p>

      {/* The form stays after a success rather than being replaced by the
          message: a shopper who signs up on a shared device may well add a
          second address, and swapping the form out reads as "it broke". */}
      <form onSubmit={submit} style={formStyle} noValidate>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          placeholder={t.footerEmailPh}
          aria-label={t.footerEmailPh}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          style={{
            ...inputStyle,
            borderColor: state === "error" ? "var(--discount)" : "var(--border-strong)",
          }}
        />
        <button type="submit" disabled={state === "sending"} style={buttonStyle}>
          {buttonLabel?.trim() || t.footerSubscribe}
        </button>
      </form>

      {message ? (
        <p
          role="status"
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            color: state === "error" ? "var(--discount)" : "var(--muted)",
          }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

const headingStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 9,
};
const blurbStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  lineHeight: 1.6,
  margin: 0,
  maxWidth: 340,
};
const formStyle: CSSProperties = {
  display: "flex",
  gap: 7,
  marginTop: 13,
  maxWidth: 340,
};
const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  background: "var(--card)",
  color: "var(--text)",
  fontSize: 12.5,
  fontFamily: "inherit",
  padding: "9px 11px",
};
const buttonStyle: CSSProperties = {
  background: "var(--primary)",
  color: "var(--on-primary)",
  border: "none",
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: "inherit",
  padding: "9px 15px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
