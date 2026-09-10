// coding-standard: maintained
/**
 * The buyer's number on the list row.
 *
 * Two things are worth defending. It must be VISIBLE — the list showed the name
 * alone, so the one identifier that is actually unique on a COD order was the one
 * thing a merchant had to open a record to read. And clicking it must not open
 * the order: the row navigates on click, so a copy that also navigates hands the
 * merchant the number and then takes the screen away from them.
 *
 * `copyText` is mocked rather than the clipboard API, because `userEvent.setup()`
 * installs its OWN `navigator.clipboard` stub and wins any race to define one —
 * a test that stubs the API directly silently exercises userEvent's clipboard and
 * asserts nothing about this component. Mocking the module also keeps the
 * secure-context fallback in `utils/clipboard.ts` where it belongs: that is its
 * concern and it has its own tests.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen } from "@/tests/test-utils";
import { CustomerPhone } from "@/components/ecommerce/orders/customer-phone";
import { copyText } from "@/utils/clipboard";

vi.mock("@/utils/clipboard", () => ({ copyText: vi.fn() }));

const copyTextMock = vi.mocked(copyText);

beforeEach(() => {
  copyTextMock.mockReset();
  copyTextMock.mockResolvedValue(undefined);
});

describe("CustomerPhone", () => {
  it("shows the number", () => {
    renderWithProviders(<CustomerPhone phone="01711111111" />);

    expect(screen.getByText("01711111111")).toBeInTheDocument();
  });

  it("renders nothing when the order carries no number", () => {
    const { container } = renderWithProviders(<CustomerPhone />);

    // An empty clickable line is noise, not a placeholder.
    expect(container).toBeEmptyDOMElement();
  });

  it("copies the number on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerPhone phone="01711111111" />);

    await user.click(screen.getByRole("button"));

    expect(copyTextMock).toHaveBeenCalledWith("01711111111");
  });

  it("does not let the click reach the row underneath", async () => {
    const user = userEvent.setup();
    const openOrder = vi.fn();

    renderWithProviders(
      // The row's own handler, which is what a bare span inside it would trigger.
      <div onClick={openOrder}>
        <CustomerPhone phone="01711111111" />
      </div>,
    );

    await user.click(screen.getByRole("button"));

    expect(copyTextMock).toHaveBeenCalled();
    expect(openOrder).not.toHaveBeenCalled();
  });

  it("says so when the clipboard refuses rather than looking like it worked", async () => {
    // Denied over plain HTTP and in some embedded views — the LAN-testing case
    // `utils/clipboard.ts` exists for.
    copyTextMock.mockRejectedValueOnce(new Error("denied"));
    const user = userEvent.setup();
    renderWithProviders(<CustomerPhone phone="01711111111" />);

    await user.click(screen.getByRole("button"));

    // The label must NOT flip to the success state on a failed copy.
    expect(screen.getByText("01711111111")).toBeInTheDocument();
    expect(screen.queryByText("Copied")).toBeNull();
  });
});
