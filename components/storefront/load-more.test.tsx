// coding-standard: maintained
/**
 * The two rules in this component that a browser can't reliably show:
 *
 * 1. The auto-load **budget** — `infinite` stops auto-loading after `AUTO_LOADS`
 *    pages and asks for a tap. Exercising it live needs a catalogue deeper than
 *    three pages; the seed store has two.
 * 2. The observer is **rebuilt when `loading` settles**. An IntersectionObserver
 *    only reports *changes* in intersection, so one left mounted across a fetch
 *    never re-fires while the sentinel stays on screen — the scroll would stall
 *    exactly one page in. That is a timing bug, and a passing scroll test proves
 *    nothing about it.
 *
 * The stub keeps every live observer so a test can fire intersection on all of
 * them, which is precisely how the real page behaves when the sentinel stays in
 * view across a re-observe.
 */
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AUTO_LOADS, LoadMore } from "./load-more";

let observers: { cb: IntersectionObserverCallback; disconnected: boolean }[] = [];

class StubObserver {
  private entry: { cb: IntersectionObserverCallback; disconnected: boolean };
  constructor(cb: IntersectionObserverCallback) {
    this.entry = { cb, disconnected: false };
    observers.push(this.entry);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.entry.disconnected = true;
  }
  takeRecords() {
    return [];
  }
}

/** Fire "the sentinel is on screen" on every observer that is still connected. */
const intersect = () =>
  act(() => {
    for (const o of observers) {
      if (!o.disconnected) {
        o.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      }
    }
  });

beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", StubObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const setup = (props: Partial<React.ComponentProps<typeof LoadMore>> = {}) => {
  const onLoad = vi.fn();
  const view = render(
    <LoadMore
      mode="infinite"
      hasMore
      loading={false}
      onLoad={onLoad}
      shown={12}
      total={60}
      {...props}
    />,
  );
  return { onLoad, view };
};

describe("LoadMore", () => {
  it("auto-loads only AUTO_LOADS pages, then asks for a tap", () => {
    const { onLoad, view } = setup();
    expect(screen.queryByRole("button")).toBeNull();

    for (let i = 0; i < AUTO_LOADS; i++) {
      intersect();
      // The fetch settles between pages, which is what re-arms the observer.
      view.rerender(
        <LoadMore mode="infinite" hasMore loading={false} onLoad={onLoad} shown={12} total={60} />,
      );
    }
    expect(onLoad).toHaveBeenCalledTimes(AUTO_LOADS);

    // Budget spent: further intersections must not fetch, and the button appears.
    intersect();
    expect(onLoad).toHaveBeenCalledTimes(AUTO_LOADS);
    expect(screen.getByRole("button")).toHaveTextContent("Load more");
  });

  it("re-arms the observer once a fetch settles", () => {
    const { onLoad, view } = setup();
    intersect();
    expect(onLoad).toHaveBeenCalledTimes(1);

    // While the fetch is in flight the observer is torn down…
    view.rerender(
      <LoadMore mode="infinite" hasMore loading onLoad={onLoad} shown={12} total={60} />,
    );
    intersect();
    expect(onLoad).toHaveBeenCalledTimes(1);

    // …and rebuilt when it settles, so a sentinel still on screen continues.
    view.rerender(
      <LoadMore mode="infinite" hasMore loading={false} onLoad={onLoad} shown={24} total={60} />,
    );
    intersect();
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it("never auto-loads in load-more mode", () => {
    const { onLoad } = setup({ mode: "loadMore" });
    intersect();
    expect(onLoad).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveTextContent("Load more");
  });

  it("shows the end state with no control once everything is loaded", () => {
    setup({ hasMore: false, shown: 60 });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Showing 60 of 60")).toBeInTheDocument();
  });

  it("announces progress politely — with auto-load there is no other cue", () => {
    setup();
    expect(screen.getByText("Showing 12 of 60")).toHaveAttribute("aria-live", "polite");
  });
});
