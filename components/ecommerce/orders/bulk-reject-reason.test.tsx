// coding-standard: maintained
/**
 * A `SimpleSelect` living inside an `AlertDialogContent`, which is the shape the
 * bulk-reject bar uses to ask one reason for a whole selection.
 *
 * It is worth its own test because the two primitives each render into their own
 * PORTAL: the select's listbox is not a DOM descendant of the alert it belongs
 * to, so the alert's dismiss-on-outside-interaction handler can read "the user
 * clicked an option" as "the user clicked away" and close the whole dialog on the
 * first pick. When that happens there is no error and no failing type — the
 * merchant just cannot answer the question, and the action stays disabled
 * forever.
 *
 * jsdom is not a browser and cannot prove the visual result, but the dismissal
 * logic is plain `pointerdown` / `focusout` handling that `userEvent` does drive,
 * so the classic failure is reproducible here.
 */
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen } from "@/tests/test-utils";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { REJECTION_REASON_OPTIONS } from "@/components/ecommerce/orders/helpers";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Button } from "@/ui/components/button";

/** The bulk bar's shape, reduced to the part under test. */
function BulkReject({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <OrderConfirmDialog
      destructive
      trigger={<Button>Reject (3)</Button>}
      title="Reject 3 orders?"
      description="Each shopper is notified their order was rejected."
      actionLabel="Reject 3 orders"
      onConfirm={() => onConfirm(reason)}
      actionDisabled={!reason}
    >
      <SimpleSelect
        value={reason}
        onValueChange={setReason}
        options={REJECTION_REASON_OPTIONS}
        placeholder="Pick a reason"
        className="w-full"
      />
    </OrderConfirmDialog>
  );
}

describe("the bulk-reject reason select, inside the alert dialog", () => {
  it("stays open when the merchant picks a reason", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BulkReject onConfirm={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Reject (3)" }));
    expect(screen.getByText("Reject 3 orders?")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Fake number" }));

    // The failure this guards: the alert closes on the first pick, because the
    // option lives in a different portal and reads as an outside click.
    expect(screen.getByText("Reject 3 orders?")).toBeInTheDocument();
  });

  it("enables the action once a reason is chosen, and reports it", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithProviders(<BulkReject onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Reject (3)" }));

    const action = screen.getByRole("button", { name: "Reject 3 orders" });
    // Held closed until the question is answered — a rejection with no reason is
    // refused by the server anyway (`REJECTION_REASON_REQUIRED`).
    expect(action).toBeDisabled();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Out of stock" }));

    expect(action).toBeEnabled();
    await user.click(action);

    expect(onConfirm).toHaveBeenCalledWith("out_of_stock");
  });
});
