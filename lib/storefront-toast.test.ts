// coding-standard: maintained
/**
 * `storefront-toast` exists so the shop's toasts are ONE decision rather than a
 * per-call-site option, and the decision is now a single field: `toasterId`.
 *
 * It is worth a test because dropping it fails SILENTLY and in the most
 * misleading way available. Sonner renders an id-less toast on the id-less
 * `<Toaster>` — the admin's, in `app/layout.tsx` — so an unstamped shop toast
 * still appears, just bottom-right, in next-themes' theme, with no close button.
 * It looks like a styling regression rather than a routing one, which is exactly
 * the bug that was there before `StorefrontToaster` existed.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const success = vi.fn();
const error = vi.fn();
const dismiss = vi.fn();

vi.mock("sonner", () => ({ toast: { success, error, dismiss } }));

const { toast, TOASTER_ID } = await import("@/lib/storefront-toast");

describe("storefront toast", () => {
  beforeEach(() => {
    success.mockClear();
    error.mockClear();
    dismiss.mockClear();
  });

  it("routes a success toast to the storefront host", () => {
    toast.success("Added to cart");
    expect(success).toHaveBeenCalledWith(
      "Added to cart",
      expect.objectContaining({ toasterId: TOASTER_ID }),
    );
  });

  it("routes an error toast there too", () => {
    toast.error("Out of stock");
    expect(error).toHaveBeenCalledWith(
      "Out of stock",
      expect.objectContaining({ toasterId: TOASTER_ID }),
    );
  });

  it("never lets the id be empty — an id-less toast falls through to the admin host", () => {
    expect(TOASTER_ID).toBeTruthy();
  });

  it("still dismisses in flight — the cart drawer IS the confirmation", () => {
    toast.dismiss();
    expect(dismiss).toHaveBeenCalled();
  });
});
