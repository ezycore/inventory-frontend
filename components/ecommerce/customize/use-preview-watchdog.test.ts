// coding-standard: maintained
/**
 * The net under the preview's draft channel.
 *
 * Worth pinning because every one of its guards is a bug someone would
 * otherwise "simplify" away: reloading during a cold start, reloading a
 * backgrounded tab whose reply is merely late, and reloading for ever when the
 * frame can never answer at all.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePreviewWatchdog } from "./use-preview-watchdog";

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  setHidden(false);
});

afterEach(() => {
  vi.useRealTimers();
});

/** One editing session: post a draft, wait out the watchdog, maybe acknowledge. */
const setup = (armed: boolean) => {
  const onStale = vi.fn();
  const view = renderHook(
    ({ signal, armed: isArmed }: { signal: object; armed: boolean }) =>
      usePreviewWatchdog({ armed: isArmed, signal, onStale, delayMs: 2000 }),
    { initialProps: { signal: {}, armed } },
  );
  return { onStale, view };
};

describe("usePreviewWatchdog", () => {
  it("reloads a frame that stops acknowledging", () => {
    const { onStale, view } = setup(true);

    act(() => view.result.current.markPosted());
    act(() => void vi.advanceTimersByTime(2000));

    expect(onStale).toHaveBeenCalledTimes(1);
  });

  it("leaves an acknowledged frame alone", () => {
    const { onStale, view } = setup(true);

    act(() => view.result.current.markPosted());
    act(() => view.result.current.markAcked());
    act(() => void vi.advanceTimersByTime(2000));

    expect(onStale).not.toHaveBeenCalled();
  });

  it("stays out of a cold start", () => {
    // Not yet armed: the frame has never applied a draft, so silence means it
    // is still booting — in dev, a first compile outlasts any timeout here.
    const { onStale, view } = setup(false);

    act(() => view.result.current.markPosted());
    act(() => void vi.advanceTimersByTime(10_000));

    expect(onStale).not.toHaveBeenCalled();
  });

  it("does not reload a backgrounded tab", () => {
    // A hidden tab's frame is throttled, not broken. Reloading would throw away
    // the merchant's place in a page they are not even looking at.
    const { onStale, view } = setup(true);
    setHidden(true);

    act(() => view.result.current.markPosted());
    act(() => void vi.advanceTimersByTime(2000));

    expect(onStale).not.toHaveBeenCalled();
  });

  it("gives up after the cap rather than cycling", () => {
    const { onStale, view } = setup(true);

    for (let i = 0; i < 6; i += 1) {
      act(() => view.result.current.markPosted());
      // A new draft re-arms the timer, exactly as an edit does.
      view.rerender({ signal: {}, armed: true });
      act(() => void vi.advanceTimersByTime(2000));
    }

    expect(onStale).toHaveBeenCalledTimes(3);
  });

  it("restores the budget once the frame answers again", () => {
    // The cap stops a frame that can NEVER answer from cycling; it must not
    // ration recoveries across a long editing session.
    const { onStale, view } = setup(true);

    for (let i = 0; i < 5; i += 1) {
      act(() => view.result.current.markPosted());
      act(() => view.result.current.markAcked());
      view.rerender({ signal: {}, armed: true });
      act(() => void vi.advanceTimersByTime(2000));
    }

    // Then one that goes unanswered. The edit re-arms the timer first, exactly
    // as the editor does — a post always rides a new payload.
    view.rerender({ signal: {}, armed: true });
    act(() => view.result.current.markPosted());
    act(() => void vi.advanceTimersByTime(2000));

    expect(onStale).toHaveBeenCalledTimes(1);
  });
});
