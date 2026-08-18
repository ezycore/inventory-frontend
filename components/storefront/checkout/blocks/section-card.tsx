"use client";
// coding-standard: maintained

import type { ReactNode } from "react";

/**
 * One numbered card in the `single` checkout.
 *
 * The number is not decoration — a checkout genuinely is a sequence, and the
 * marker tells a shopper how many more of these there are before the button.
 * **It lives in the layout, not in the blocks**, which is what keeps it from
 * colliding with `guided`'s own 1–4 numbering: a block that numbered itself
 * would number itself twice there.
 */
export function SectionCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 999,
            flex: "none",
            background: "var(--primary)",
            color: "var(--on-primary)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {n}
        </span>
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
