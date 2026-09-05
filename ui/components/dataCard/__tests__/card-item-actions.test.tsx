// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CardItem } from "../card-variants";
import type { CardCustomAction } from "@/types/DataCard";

/**
 * Per-row custom actions survive the switch to card view.
 *
 * Two findings, one root cause. `/products` declares Print Label as
 * `placement: "cell"` — the table's vocabulary — and shares that one array
 * with the DataCard behind the ViewToggle. Card view filtered `customActions`
 * to `placement === "menu"` alone, so the printer vanished; `useViewMode`
 * remembers the choice, so a merchant who switched to cards lost label
 * printing until they switched back (QA-T1-E).
 *
 * The second half: a `renderCard` was handed only `{onEdit, onView, onDelete}`,
 * so a page with a custom card got no actions at all and no warning. That cost
 * the users card its Enable/Disable control (QA-R20).
 */

const row = { _id: "p1", name: "Panjabi" };

const printLabel = (
  patch: Partial<CardCustomAction> = {},
): CardCustomAction => ({
  type: "print-label",
  placement: "cell",
  label: "Print Label",
  // `compact` renders the icon alone with the label in a hover tooltip;
  // `detailed` uses a dropdown that prints the label. The icon is the one
  // thing findable in both without opening anything.
  icon: <span data-testid="printer" />,
  onClick: vi.fn(),
  ...patch,
});

describe("CardItem — custom actions", () => {
  it("renders a cell-placed action among the built-in icon buttons", () => {
    // The regression: this filtered to `placement === "menu"` and dropped it.
    render(
      <CardItem
        data={row}
        variant="compact"
        actions={{ editable: true }}
        onEdit={vi.fn()}
        customActions={[printLabel()]}
      />,
    );

    expect(screen.getByTestId("printer")).toBeInTheDocument();
  });

  it("calls a cell-placed action with its row", async () => {
    const onClick = vi.fn();
    const u = userEvent.setup();
    render(
      <CardItem
        data={row}
        variant="compact"
        actions={{ editable: true }}
        onEdit={vi.fn()}
        customActions={[printLabel({ onClick })]}
      />,
    );

    await u.click(screen.getByTestId("printer"));

    expect(onClick).toHaveBeenCalledWith(row);
  });

  it("labels a cell-placed action in the kebab variant", async () => {
    // `detailed` overlays a dropdown instead of the icon row, and a dropdown
    // prints the label rather than hiding it in a hover tooltip. Both card
    // shapes are covered because the placement filter is per-variant and a
    // third one is one edit away.
    const u = userEvent.setup();
    render(
      <CardItem
        data={row}
        variant="detailed"
        actions={{ editable: true }}
        onEdit={vi.fn()}
        customActions={[printLabel()]}
      />,
    );

    await u.click(screen.getByRole("button"));

    expect(await screen.findByText("Print Label")).toBeInTheDocument();
  });

  it("honours a per-row disabled predicate in the built-in buttons", () => {
    render(
      <CardItem
        data={row}
        variant="compact"
        actions={{ editable: true }}
        onEdit={vi.fn()}
        customActions={[
          printLabel({ disabled: (r: { _id: string }) => r._id === "p1" }),
        ]}
      />,
    );

    expect(screen.getByTestId("printer").closest("button")).toBeDisabled();
  });

  it("hands bound actions to a custom card", () => {
    // The QA-R20 half: a custom card used to receive nothing.
    const seen: unknown[] = [];
    render(
      <CardItem
        data={row}
        renderCard={(_data, actions) => {
          seen.push(actions.customActions);
          return <div>card</div>;
        }}
        customActions={[printLabel()]}
      />,
    );

    expect(seen[0]).toHaveLength(1);
    expect(seen[0]).toMatchObject([
      { type: "print-label", label: "Print Label" },
    ]);
  });

  it("binds the row into the handler it hands over", async () => {
    const onClick = vi.fn();
    const u = userEvent.setup();
    render(
      <CardItem
        data={row}
        renderCard={(_data, actions) => (
          <button onClick={actions.customActions?.[0]?.onClick}>run</button>
        )}
        customActions={[printLabel({ onClick })]}
      />,
    );

    await u.click(screen.getByRole("button", { name: "run" }));

    expect(onClick).toHaveBeenCalledWith(row);
  });

  it("resolves a per-row disabled predicate before handing it over", () => {
    let bound: { disabled?: boolean } | undefined;
    render(
      <CardItem
        data={row}
        renderCard={(_data, actions) => {
          bound = actions.customActions?.[0];
          return <div>card</div>;
        }}
        customActions={[
          printLabel({ disabled: (r: { _id: string }) => r._id === "p1" }),
        ]}
      />,
    );

    expect(bound?.disabled).toBe(true);
  });

  it("keeps page-level placements out of the row", () => {
    // `header`/`footer` belong to the toolbar, not to each card.
    let bound: unknown[] | undefined;
    render(
      <CardItem
        data={row}
        renderCard={(_data, actions) => {
          bound = actions.customActions;
          return <div>card</div>;
        }}
        customActions={[
          printLabel(),
          { type: "bulk", placement: "header", label: "Bulk" },
        ]}
      />,
    );

    expect(bound).toHaveLength(1);
  });
});
