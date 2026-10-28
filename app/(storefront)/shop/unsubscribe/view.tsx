"use client";
// coding-standard: maintained

import { useState } from "react";
import { unsubscribeFromEmail, type UnsubscribeResult } from "@/lib/storefront-client";
import { ContentFrame } from "@/components/storefront/content-frame";

/** What each consent flag means to the person reading this page. */
const KIND: Record<UnsubscribeResult["flag"], string> = {
  promoEmail: "promotional emails, like reminders about your cart",
  priceDrop: "wishlist alerts — back-in-stock and price-drop emails",
  newsletter: "the newsletter",
};

/**
 * The footer link's landing page. It asks for one click rather than acting on
 * load: mail scanners open links in emails, and an opt-out that fires on a GET
 * would unsubscribe people who never asked. Mail clients' own one-click
 * unsubscribe skips this page and POSTs to the API directly.
 */
export default function View({ token }: { token: string | null }) {
  const [state, setState] = useState<"ready" | "busy" | "done" | "error">("ready");
  const [result, setResult] = useState<UnsubscribeResult | null>(null);

  const confirm = async () => {
    if (!token) return;
    setState("busy");
    try {
      setResult(await unsubscribeFromEmail(token));
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done" && result) {
    return (
      <ContentFrame title="You're unsubscribed">
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          {result.storeName ? `${result.storeName} won't send you ` : "You won't get "}
          {KIND[result.flag]} any more. Emails about your orders still arrive as usual. You
          can turn this back on from your account&apos;s notification settings.
        </p>
      </ContentFrame>
    );
  }

  const invalid = state === "error" || !token || token.length < 10;
  return (
    <ContentFrame title="Unsubscribe">
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
        {invalid
          ? "This unsubscribe link isn't valid. Use the link in the most recent email, or turn emails off from your account's notification settings."
          : "Stop getting this kind of email from this shop? Emails about your orders will still arrive."}
      </p>
      {invalid ? null : (
        <button
          type="button"
          onClick={confirm}
          disabled={!token || state === "busy"}
          style={{
            padding: "11px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "var(--accent-contrast, #fff)",
            fontSize: 14,
            cursor: token && state !== "busy" ? "pointer" : "default",
            opacity: token && state !== "busy" ? 1 : 0.6,
          }}
        >
          {state === "busy" ? "…" : "Unsubscribe"}
        </button>
      )}
    </ContentFrame>
  );
}
