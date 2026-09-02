// coding-standard: maintained
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import { CourierProgress } from "./courier-progress";

/**
 * The shopper's parcel feed, grouped under the carrier's own phase headings.
 *
 * Rendered rather than reasoned about because the admin version of this exact
 * grouping shipped a bug that type-check, lint and the whole suite passed:
 * `last.name === event.group` matches when BOTH are `undefined`, so a feed with no
 * headings — every Steadfast parcel, every manual courier — collapsed into a
 * single group under one dot. That failure is invisible except on screen or here.
 */
const withUI = (ui: React.ReactElement) =>
  render(<StorefrontUIProvider>{ui}</StorefrontUIProvider>);

/** The live Pathao feed, as `toShopperCourier` hands it over. */
const pathaoFeed = {
  name: "pathao",
  normalizedStatus: "delivered",
  history: [
    { status: "pending", group: "Accepted", label: "Pickup requested.", at: "2026-08-17T12:31:00.000Z" },
    { status: "pending", group: "Accepted", label: "Order confirmed.", at: "2026-08-17T12:36:00.000Z" },
    { status: "in_transit", group: "Picked", label: "Received at pickup hub: Rayerbag.", at: "2026-08-17T17:50:00.000Z" },
    { status: "delivered", group: "Delivered", label: "Delivered.", at: "2026-08-19T05:08:00.000Z" },
  ],
};

/** A manual courier (or Steadfast): the same feed shape with no headings at all. */
const ungroupedFeed = {
  name: "RedX",
  normalizedStatus: "in_transit",
  history: [
    { status: "pending", label: "Handed to RedX", at: "2026-08-21T06:00:00.000Z" },
    { status: "in_transit", label: "Left Mirpur hub", at: "2026-08-21T11:30:00.000Z" },
  ],
};

beforeEach(() => localStorage.clear());

describe("CourierProgress — the shopper's parcel feed", () => {
  it("shows the carrier's own sentence for every event", () => {
    withUI(<CourierProgress courier={pathaoFeed as never} />);

    // Four events, not one row per normalized status — two of these are `pending`
    // and would have collapsed under the old status-keyed feed.
    expect(screen.getByText("Pickup requested.")).toBeInTheDocument();
    expect(screen.getByText("Order confirmed.")).toBeInTheDocument();
    expect(screen.getByText("Received at pickup hub: Rayerbag.")).toBeInTheDocument();
    expect(screen.getByText("Delivered.")).toBeInTheDocument();
  });

  it("prints each carrier phase heading once, however many events it holds", () => {
    withUI(<CourierProgress courier={pathaoFeed as never} />);

    // "Accepted" holds two events and must appear once — that collapse is what
    // makes the feed read like the carrier's own tracking page.
    expect(screen.getAllByText("Accepted")).toHaveLength(1);
    expect(screen.getByText("Picked")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("keeps ungrouped events apart instead of folding them together", () => {
    // The admin bug, pinned here: `undefined === undefined` must NOT group.
    const { container } = withUI(<CourierProgress courier={ungroupedFeed as never} />);

    expect(screen.getByText("Handed to RedX")).toBeInTheDocument();
    expect(screen.getByText("Left Mirpur hub")).toBeInTheDocument();
    // Two events with no heading ⇒ two rail rows, each with its own dot, rather
    // than one row wearing the tone of whichever event happened to be last.
    const rails = container.querySelectorAll<HTMLElement>("span[style*='border-radius: 50%']");
    expect(rails.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to our normalized label when an event carries no sentence", () => {
    // A status-only push, and every manual update made without a note.
    withUI(
      <CourierProgress
        courier={{ normalizedStatus: "in_transit", history: [{ status: "in_transit", at: "2026-08-21T11:30:00.000Z" }] } as never}
      />,
    );
    // "On the way" — the shopper wording, not the admin's "In transit".
    expect(screen.getAllByText("On the way").length).toBeGreaterThan(0);
  });

  it("translates the phase heading for a Bangla shopper", () => {
    // The event sentences are the courier's free text and stay English; the phase
    // is the part a Bangla buyer actually needs, and it is a closed vocabulary.
    // The key the UI context's external store reads — not a guess; see
    // `services/storefront/ui-context.tsx`.
    localStorage.setItem("ezy-sf-lang", "bn");
    withUI(<CourierProgress courier={pathaoFeed as never} />);

    expect(screen.getByText("গৃহীত")).toBeInTheDocument();
    expect(screen.getByText("পিকআপ হয়েছে")).toBeInTheDocument();
    expect(screen.getByText("Received at pickup hub: Rayerbag.")).toBeInTheDocument();
  });

  it("shows an unknown heading verbatim rather than dropping it", () => {
    // A carrier adding a phase must never blank a row.
    withUI(
      <CourierProgress
        courier={{
          normalizedStatus: "in_transit",
          history: [{ status: "in_transit", group: "At The Border", label: "Held at customs.", at: "2026-08-21T11:30:00.000Z" }],
        } as never}
      />,
    );
    expect(screen.getByText("At The Border")).toBeInTheDocument();
  });
});
