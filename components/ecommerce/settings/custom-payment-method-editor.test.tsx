// coding-standard: maintained
/**
 * One payment method's row, and the editor it opens into.
 *
 * Two behaviours carry real weight. The ROW has to be readable without being
 * opened — that is the whole reason this tab was rebuilt, and the summary line is
 * what makes it work. And the field editor must not appear until the method has
 * an **id**: notes and questions are checkout fields locked to that id, and the
 * backend does not mint one until the first save, so an editor shown too early
 * would create entries that name nothing and never render.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomPaymentMethodEditor } from "./custom-payment-method-editor";

const props = {
  enabled: true,
  open: true,
  summary: "Ask each time",
  fields: [],
  canMoveUp: false,
  canMoveDown: false,
  onToggleOpen: vi.fn(),
  onMethodChange: vi.fn(),
  onAccountChange: vi.fn(),
  onEnabledChange: vi.fn(),
  onFieldsChange: vi.fn(),
  onMove: vi.fn(),
  onRemove: vi.fn(),
};

const bkash = { id: "bkash", title: "bKash payment" };

describe("the collapsed row", () => {
  it("reads without being opened", () => {
    render(
      <CustomPaymentMethodEditor
        {...props}
        open={false}
        method={{ ...bkash, subtitle: "Send Money" }}
        summary="Ask each time · note + 1 field"
      />,
    );

    expect(screen.getByText("bKash payment")).toBeInTheDocument();
    expect(screen.getByText("Send Money")).toBeInTheDocument();
    // The summary is the point: where the money goes and what it asks for,
    // without opening anything.
    expect(screen.getByText("Ask each time · note + 1 field")).toBeInTheDocument();
  });

  it("keeps the detail out of the DOM while closed", () => {
    render(<CustomPaymentMethodEditor {...props} open={false} method={bkash} />);

    expect(screen.queryByText("Payment method title")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add note" })).toBeNull();
  });

  it("opens from the title and from the chevron", () => {
    const onToggleOpen = vi.fn();
    render(
      <CustomPaymentMethodEditor
        {...props}
        open={false}
        method={bkash}
        onToggleOpen={onToggleOpen}
      />,
    );

    fireEvent.click(screen.getByText("bKash payment"));
    fireEvent.click(screen.getByRole("button", { name: "Open bKash payment" }));
    expect(onToggleOpen).toHaveBeenCalledTimes(2);
  });

  it("does NOT open the row when the switch is used", () => {
    // The switch sits outside the toggle target on purpose — nested inside it,
    // every enable/disable would also expand the row.
    const onToggleOpen = vi.fn();
    const onEnabledChange = vi.fn();
    render(
      <CustomPaymentMethodEditor
        {...props}
        open={false}
        method={bkash}
        onToggleOpen={onToggleOpen}
        onEnabledChange={onEnabledChange}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Offer bKash payment at checkout" }));
    expect(onEnabledChange).toHaveBeenCalled();
    expect(onToggleOpen).not.toHaveBeenCalled();
  });

  it("names an unsaved method rather than rendering a blank row", () => {
    render(<CustomPaymentMethodEditor {...props} open={false} method={{ title: "  " }} />);

    expect(screen.getByText("Untitled payment method")).toBeInTheDocument();
  });
});

describe("CustomPaymentMethodEditor", () => {
  it("creates notes and inputs already scoped to this method's id", () => {
    const onFieldsChange = vi.fn();
    render(
      <CustomPaymentMethodEditor {...props} method={bkash} onFieldsChange={onFieldsChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    expect(onFieldsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        kind: "notice",
        slot: "after-payment",
        tone: "info",
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
          method={bkash}
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

    it("gives the note room to hold real instructions", () => {
      // Account name, number and branch do not fit in a one-line box.
      renderSaved({ kind: "notice" });
      expect(screen.getByPlaceholderText(/Send Money to/i).tagName).toBe("TEXTAREA");
    });

    it("drops the per-entry card header — no kind dropdown, no reorder", () => {
      // The shipped layout wrapped every entry in a bordered card with its own
      // header row. That was the third level of card nesting.
      renderSaved({ kind: "notice" });
      expect(screen.queryByText("Notice — text they read")).toBeNull();
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
        <CustomPaymentMethodEditor {...props} method={bkash} accountOptions={accountOptions} />,
      );

      expect(screen.getByText("Receiving account")).toBeInTheDocument();
    });

    it("shows the connected account on the closed control", () => {
      render(
        <CustomPaymentMethodEditor
          {...props}
          method={bkash}
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
        <CustomPaymentMethodEditor {...props} method={bkash} accountOptions={accountOptions} />,
      );

      expect(screen.getByText("Ask me each time")).toBeInTheDocument();
    });

    it("says nothing at all when the accounts feature is off", () => {
      // No accounts to connect to, so the control would be a dead end.
      render(<CustomPaymentMethodEditor {...props} method={bkash} />);

      expect(screen.queryByText("Receiving account")).toBeNull();
    });
  });

  describe("the icon picker", () => {
    it("lets a merchant mark this method", () => {
      // The point is several methods telling themselves apart: bKash, Nagad and
      // a bank all drawing the same card is barely better than drawing nothing.
      const onMethodChange = vi.fn();
      render(
        <CustomPaymentMethodEditor {...props} method={bkash} onMethodChange={onMethodChange} />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Mobile wallet" }));
      expect(onMethodChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: "bkash", icon: "phone" }),
      );
    });

    it("shows the card mark as chosen when none is set", () => {
      render(<CustomPaymentMethodEditor {...props} method={bkash} />);

      expect(screen.getByRole("button", { name: "Card" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  describe("Cash on Delivery in the same list", () => {
    const cod = {
      id: "cod",
      title: "Cash on Delivery",
      subtitle: "the shopper pays the rider",
    };

    it("has no title, subtitle, icon or delete — the platform owns those", () => {
      render(<CustomPaymentMethodEditor {...props} builtIn method={cod} />);

      expect(screen.queryByText("Payment method title")).toBeNull();
      expect(screen.queryByText("Icon")).toBeNull();
      expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
      expect(screen.getByText(/Built in/i)).toBeInTheDocument();
    });

    it("CAN carry instructions, which it could not as a checkbox", () => {
      // The gain from unifying it into the list: "have the exact amount ready".
      const onFieldsChange = vi.fn();
      render(
        <CustomPaymentMethodEditor
          {...props}
          builtIn
          method={cod}
          onFieldsChange={onFieldsChange}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Add note" }));
      expect(onFieldsChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ showWhen: { paymentMethods: ["cod"] } }),
      ]);
    });

    it("can still name a receiving account", () => {
      render(
        <CustomPaymentMethodEditor
          {...props}
          builtIn
          method={cod}
          accountOptions={[{ label: "Cash", value: "acc-cash" }]}
          accountId="acc-cash"
        />,
      );

      expect(screen.getByText("Cash")).toBeInTheDocument();
    });
  });
});
