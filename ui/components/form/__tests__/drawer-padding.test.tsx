// coding-standard: maintained

import { useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DynamicForm from "../index";
import type { DynamicFormConfig } from "../type";

// The container renders a discard-confirmation dialog that reads copy through
// next-intl. Keys are fine here — nothing in this file asserts on wording.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

/**
 * The drawer's scroll viewport has to leave room at the TOP, and has to stop
 * spending the width of a phone on side gutters.
 *
 * **Top.** `Card` draws its outline with `ring-1`, and a ring is a box-shadow
 * painted outside the element's box. The first section card sat flush against
 * the top of a scroll container with no `pt`, so its top ring landed a pixel
 * above the content box and was clipped — the card rendered with left, right
 * and bottom outlines and no top one, which reads as the border being cut off
 * by the header above it. Every other side had padding; only the top did not.
 *
 * **Sides.** This container and the `px-4 sm:px-6` cards inside it were each
 * paying a full-size gutter, stacking 24px + 16px per side. On a 360px phone
 * that is 80px of chrome before a field starts. The outer gutter only has to
 * expose the card's edge and its ring, so it is the half that shrinks.
 *
 * Asserted as a class contract, not as geometry: jsdom performs no layout, so
 * a clipped ring is invisible to it and any measurement would pass against the
 * bug. That is the same reason `plain-header.test.tsx` asserts classes.
 */
const config: DynamicFormConfig = {
  sections: [
    {
      title: "Basic information",
      fields: [{ name: "name", type: "input", label: "Name" }],
    },
  ],
};

const render = (ui: React.ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

function Harness({ openInside }: { openInside: "drawer" | "modal" }) {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <DynamicForm
      form={form}
      config={config}
      title="Add product"
      openInside={openInside}
      open
      onOpenChange={() => {}}
      onSubmit={() => {}}
    />
  );
}

/** The scroll viewport is the form's parent — the element that would clip. */
function renderIn(openInside: "drawer" | "modal") {
  render(<Harness openInside={openInside} />);
  const form = document.querySelector("form");
  if (!form?.parentElement) throw new Error(`${openInside} form did not render`);
  return form.parentElement;
}

const renderDrawer = () => renderIn("drawer");

describe("drawer scroll viewport", () => {
  it("scrolls, which is what makes the padding matter", () => {
    expect(renderDrawer().className).toContain("overflow-y-auto");
  });

  it("leaves room at the top for the first card's ring", () => {
    const viewport = renderDrawer();
    // The value is free; having one is not. `pt-0` — or no `pt` at all, which
    // is how this shipped — clips the ring.
    expect(viewport.className).toMatch(/(^|\s)pt-[1-9]/);
    expect(viewport.className).not.toMatch(/(^|\s)pt-0(\s|$)/);
  });

  it("keeps a smaller gutter on phones than at sm and up", () => {
    const { className } = renderDrawer();
    const mobile = Number(/(?:^|\s)px-([0-9]+)/.exec(className)?.[1]);
    const desktop = Number(/(?:^|\s)sm:px-([0-9]+)/.exec(className)?.[1]);
    expect(mobile).toBeGreaterThan(0);
    expect(mobile).toBeLessThan(desktop);
  });

  it("keeps that gutter narrower than the cards nested inside it", () => {
    // The cards use px-4 on mobile. An outer gutter at least as wide doubles
    // the chrome for no gain — the inner padding is what keeps text off an
    // edge; this one only has to reveal the card's outline.
    const mobile = Number(/(?:^|\s)px-([0-9]+)/.exec(renderDrawer().className)?.[1]);
    expect(mobile).toBeLessThan(4);
  });

  it("aligns the header gutter with the body's", () => {
    renderDrawer();
    // Whatever the body uses, the title must start at the same x — otherwise
    // the header reads as inset from the cards below it.
    const header = screen.getByText("Add product").closest("div");
    expect(header?.className).toContain("px-3");
    expect(header?.className).toContain("sm:px-6");
  });
});

describe("modal scroll viewport", () => {
  it("leaves room at the top too, for the same ring", () => {
    // The dialog header's own `pb-2` sits outside the scroll container, so it
    // never gave the first card's ring anywhere to land.
    expect(renderIn("modal").className).toMatch(/(^|\s)pt-[1-9]/);
  });
});
