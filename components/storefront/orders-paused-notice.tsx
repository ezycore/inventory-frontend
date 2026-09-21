"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { OrdersPaused } from "@/lib/storefront-orders-paused";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * What a paused store shows where its buy buttons were: the merchant's own
 * message, and — when they offered it — the WhatsApp chat, labelled with the
 * storefront's existing "Order on chat instead" wording.
 */
export function OrdersPausedNotice({ paused, compact = false }: { paused: OrdersPaused; compact?: boolean }) {
  const { t } = useStorefrontUI();
  return (
    <div role="status" style={{ ...box, padding: compact ? 12 : 16 }}>
      {paused.message ? (
        <p style={{ margin: 0, fontSize: compact ? 13 : 14, lineHeight: 1.55, whiteSpace: "pre-line" }}>
          {paused.message}
        </p>
      ) : null}
      {paused.whatsappHref ? (
        <a href={paused.whatsappHref} target="_blank" rel="noopener noreferrer" style={chat}>
          <Icon name="whatsapp" size={16} /> {t.chatOrderInstead}
        </a>
      ) : null}
    </div>
  );
}

const box: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: "var(--radius-md)",
  textAlign: "left",
};

const chat: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: "var(--radius-sm)",
  background: "#25D366",
  color: "#ffffff",
  fontSize: 13.5,
  fontWeight: 600,
  textDecoration: "none",
};
