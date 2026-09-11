// coding-standard: maintained
/**
 * The bug this component exists for: a shopper browsing a LIGHT shop was served
 * a near-black success toast, because the only `<Toaster>` on the page read
 * `next-themes` — the admin app's theme — while the storefront's light/dark is
 * `.sf-root[data-theme]` from `ezy-sf-theme`. The two are unrelated, and the
 * toaster portals to <body>, outside `.sf-root`, so it could not inherit either.
 *
 * So the thing worth pinning is narrow and exact: the host takes its theme from
 * the SHOPPER's context, and it claims the id that `storefront-toast` stamps.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const toasterProps: Record<string, unknown>[] = [];
vi.mock("sonner", () => ({
  Toaster: (props: Record<string, unknown>) => {
    toasterProps.push(props);
    return null;
  },
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

const theme = vi.fn(() => "light");
vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ theme: theme() }),
}));

const { StorefrontToaster } = await import(
  "@/components/storefront/storefront-toaster"
);
const { TOASTER_ID } = await import("@/lib/storefront-toast");

const renderToaster = () => {
  toasterProps.length = 0;
  render(<StorefrontToaster />);
  return toasterProps[0];
};

describe("StorefrontToaster", () => {
  it("takes the shopper's theme, not next-themes", () => {
    theme.mockReturnValue("dark");
    expect(renderToaster().theme).toBe("dark");

    theme.mockReturnValue("light");
    expect(renderToaster().theme).toBe("light");
  });

  it("claims the id that storefront-toast stamps, or every shop toast falls through to the admin host", () => {
    theme.mockReturnValue("light");
    expect(renderToaster().id).toBe(TOASTER_ID);
  });

  it("keeps the placement and close button the shop needs", () => {
    theme.mockReturnValue("light");
    const props = renderToaster();
    // Top-center: the shop's bottom strip is owned by the cart drawer footer,
    // the mobile bottom nav and the sticky buy-bar.
    expect(props.position).toBe("top-center");
    expect(props.closeButton).toBe(true);
  });

  it("names the classes the close-button CSS keys off", () => {
    theme.mockReturnValue("light");
    const props = renderToaster() as {
      toastOptions?: { classNames?: Record<string, string> };
    };
    // storefront.css restyles the close button through these two class names —
    // renaming one here silently restores sonner's corner-hung circle.
    expect(props.toastOptions?.classNames?.toast).toBe("sf-toast");
    expect(props.toastOptions?.classNames?.closeButton).toBe("sf-toast-close");
  });
});
