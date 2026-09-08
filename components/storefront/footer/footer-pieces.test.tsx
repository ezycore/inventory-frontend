import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BottomBar,
  type FooterT,
} from "@/components/storefront/footer/footer-pieces";
import type { StorefrontStore } from "@/lib/storefront-client";

const t = {
  poweredBy: "Powered by",
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
} as FooterT;

const store = {
  currency: "BDT",
  allowedPaymentMethods: ["cod", "bank"],
} as StorefrontStore;

describe("footer payment methods", () => {
  it("shows enabled methods by default", () => {
    render(<BottomBar name="Acme" store={store} t={t} />);

    expect(screen.getByText("Cash on Delivery")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.getByText("Cash on Delivery").parentElement).not.toHaveClass(
      "sf-desktop-only",
      "sf-mobile-only",
      "sf-strip-hidden",
    );
  });

  it.each([
    [true, false, "sf-desktop-only"],
    [false, true, "sf-mobile-only"],
    [false, false, "sf-strip-hidden"],
  ])(
    "supports desktop=%s and mobile=%s without changing checkout configuration",
    (showOnDesktop, showOnMobile, expectedClass) => {
    render(
      <BottomBar
        name="Acme"
        store={store}
        t={t}
        footerPaymentMethods={{ showOnDesktop, showOnMobile }}
      />,
    );

      expect(screen.getByText("Cash on Delivery").parentElement).toHaveClass(
        expectedClass,
      );
      expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    },
  );
});
