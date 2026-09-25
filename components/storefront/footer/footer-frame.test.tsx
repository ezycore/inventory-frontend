import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BottomBar, FooterShell } from "@/components/storefront/footer/footer-frame";
import type { FooterT } from "@/components/storefront/footer/footer-model";
import type { StorefrontStore } from "@/lib/storefront-client";

const t = {
  poweredBy: "Powered by",
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
  customPayment: "Custom payment",
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

  it("shows the merchant's own title for a method they defined", () => {
    render(
      <BottomBar
        name="Acme"
        store={{
          ...store,
          allowedPaymentMethods: ["bkash"],
          paymentMethods: [{ id: "bkash", title: "bKash payment" }],
        }}
        t={t}
      />,
    );

    expect(screen.getByText("bKash payment")).toBeInTheDocument();
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

describe("footer credit and frame", () => {
  it("shows the Powered by EzyCore credit by default", () => {
    render(<BottomBar name="Acme" store={store} t={t} />);
    expect(screen.getByRole("link", { name: "EzyCore" })).toHaveAttribute("href", "https://ezycore.com/");
  });

  it("hides the credit when the merchant switches it off, keeping the copyright", () => {
    render(<BottomBar name="Acme" store={store} t={t} footerStyle={{ showPoweredBy: false }} />);
    expect(screen.queryByRole("link", { name: "EzyCore" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Powered by/)).not.toBeInTheDocument();
    expect(screen.getByText(/© \d{4} Acme/)).toBeInTheDocument();
  });

  it("carries the phone arrangement beside the desktop one", () => {
    const { container } = render(
      <BottomBar name="Acme" store={store} t={t} footerStyle={{ bottomAlign: { base: "spread", mobile: "center" } }} />,
    );
    const bar = container.querySelector(".sf-footer-bottom");
    expect(bar).toHaveAttribute("data-align", "spread");
    expect(bar).toHaveAttribute("data-align-m", "center");
  });

  it("paints an untouched footer with no ground switches", () => {
    const { container } = render(<FooterShell>body</FooterShell>);
    const footer = container.querySelector("footer");
    expect(footer).not.toHaveAttribute("data-ground");
    expect(footer).not.toHaveAttribute("data-ink");
  });
});
