// coding-standard: maintained
/**
 * One merchant-defined payment method's editor.
 *
 * The behaviour worth pinning is the id gate. A method's notes and questions are
 * ordinary checkout fields locked to that method's **id**, and the id does not
 * exist until the backend mints it from the title on first save. So a brand-new
 * row must not offer the field editor at all — the fields it created would name
 * nothing and never render.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomPaymentMethodEditor } from "./custom-payment-method-editor";

const props = {
  enabled: true,
  fields: [],
  canMoveUp: false,
  canMoveDown: false,
  onMethodChange: vi.fn(),
  onAccountChange: vi.fn(),
  onEnabledChange: vi.fn(),
  onFieldsChange: vi.fn(),
  onMove: vi.fn(),
  onRemove: vi.fn(),
};

describe("CustomPaymentMethodEditor", () => {
  it("creates notes and inputs already scoped to this method's id", () => {
    const onFieldsChange = vi.fn();
    render(
      <CustomPaymentMethodEditor
        {...props}
        method={{ id: "bkash", title: "bKash payment" }}
        onFieldsChange={onFieldsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    expect(onFieldsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        kind: "notice",
        slot: "after-payment",
        showWhen: { paymentMethods: ["bkash"] },
      }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Add field" }));
    expect(onFieldsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        kind: "input",
        type: "text",
        slot: "after-payment",
        showWhen: { paymentMethods: ["bkash"] },
      }),
    ]);
  });

  it("scopes to whichever method it is editing", () => {
    const onFieldsChange = vi.fn();
    render(
      <CustomPaymentMethodEditor
        {...props}
        method={{ id: "nagad", title: "Nagad" }}
        onFieldsChange={onFieldsChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    expect(onFieldsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ showWhen: { paymentMethods: ["nagad"] } }),
    ]);
  });

  it("withholds the field editor until the method has been saved an id", () => {
    render(<CustomPaymentMethodEditor {...props} method={{ title: "Rocket" }} />);

    expect(screen.queryByRole("button", { name: "Add note" })).toBeNull();
    expect(screen.getByText(/does not exist until then/i)).toBeInTheDocument();
  });

  describe("the editor is cut down to a note and a field", () => {
    // A payment method needs how-to-pay and what-to-send-back. Every other
    // control the checkout editor offers is noise here — and "Where it appears"
    // was worse than noise, letting a merchant slot bKash instructions into the
    // ADDRESS section. These pin the smaller surface so it cannot creep back.
    const renderSaved = (field: Record<string, unknown>) =>
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
          fields={[{ key: "k", label: "", ...field } as never]}
        />,
      );

    it("never offers to place a payment note somewhere else", () => {
      renderSaved({ kind: "notice" });
      expect(screen.queryByText("Where it appears")).toBeNull();
    });

    it("DOES let a merchant colour the note", () => {
      // The exception to the cut. When a shopper picks bKash, "send money to
      // this number" is the most important thing on the page; plain text buries
      // it, so tone is the one styling control that earns its place here.
      renderSaved({ kind: "notice" });
      expect(screen.getByText("Style")).toBeInTheDocument();
      expect(screen.getByText("Warning")).toBeInTheDocument();
    });

    it("drops help text, which explains a question nobody is asking", () => {
      renderSaved({ kind: "input", type: "text" });
      expect(screen.queryByPlaceholderText(/help text/i)).toBeNull();
    });

    it("keeps Required, which is the one thing worth choosing", () => {
      // "The order cannot be placed without a transaction id" is a real need.
      renderSaved({ kind: "input", type: "text" });
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    it("does not offer input types — a transaction id is a line of text", () => {
      renderSaved({ kind: "input", type: "text" });
      expect(screen.queryByText("Dropdown")).toBeNull();
      expect(screen.queryByText("Number")).toBeNull();
    });

    it("starts a new note tinted, not plain", () => {
      // A merchant who never opens the style picker should still get a box the
      // shopper's eye lands on.
      const onFieldsChange = vi.fn();
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
          onFieldsChange={onFieldsChange}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Add note" }));
      expect(onFieldsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ kind: "notice", tone: "info" }),
      ]);
    });

    it("gives the note room to hold real instructions", () => {
      // Account name, number and branch do not fit in a one-line box.
      renderSaved({ kind: "notice" });
      expect(screen.getByPlaceholderText(/Send Money to/i).tagName).toBe("TEXTAREA");
    });
  });

  describe("the icon picker", () => {
    it("lets a merchant mark this method", () => {
      // The point is several methods telling themselves apart: bKash, Nagad and
      // a bank all drawing the same card is barely better than drawing nothing.
      const onMethodChange = vi.fn();
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
          onMethodChange={onMethodChange}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Mobile wallet" }));
      expect(onMethodChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: "bkash", icon: "phone" }),
      );
    });

    it("shows the card mark as chosen when none is set", () => {
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
        />,
      );

      expect(screen.getByRole("button", { name: "Card" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("is offered before the method is saved, unlike the field editor", () => {
      // It writes to the method itself, not to fields that need its id.
      render(<CustomPaymentMethodEditor {...props} method={{ title: "Rocket" }} />);

      expect(screen.getByRole("button", { name: "Mobile wallet" })).toBeInTheDocument();
    });
  });

  describe("the receiving account", () => {
    const accountOptions = [
      { label: "bKash Merchant", value: "acc-1" },
      { label: "City Bank", value: "acc-2" },
    ];

    it("offers the control when the workspace has accounts", () => {
      // Without this, marking such an order paid throws NO_RECEIVING_ACCOUNT and
      // the merchant picks an account by hand on every order.
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
          accountOptions={accountOptions}
        />,
      );

      expect(screen.getByText("Receiving account")).toBeInTheDocument();
    });

    it("shows the connected account on the closed control", () => {
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
          accountOptions={accountOptions}
          accountId="acc-1"
        />,
      );

      expect(screen.getByText("bKash Merchant")).toBeInTheDocument();
    });

    it("reads as 'Ask me each time' when nothing is connected", () => {
      // The right answer for a method whose money lands somewhere different each
      // time — so unset must be a visible choice, not a blank control.
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
          accountOptions={accountOptions}
        />,
      );

      expect(screen.getByText("Ask me each time")).toBeInTheDocument();
    });

    it("says nothing at all when the accounts feature is off", () => {
      // No accounts to connect to, so the control would be a dead end.
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={{ id: "bkash", title: "bKash payment" }}
        />,
      );

      expect(screen.queryByText("Receiving account")).toBeNull();
    });
  });

  it("names an unsaved method rather than rendering a blank heading", () => {
    render(<CustomPaymentMethodEditor {...props} method={{ title: "  " }} />);

    expect(screen.getByText("Untitled payment method")).toBeInTheDocument();
  });
});
