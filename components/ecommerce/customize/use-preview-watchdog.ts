"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef } from "react";

/**
 * Notices when a preview frame has stopped answering, and asks the caller to
 * reload it.
 *
 * The storefront acknowledges every draft it applies, so a post that goes
 * unanswered means the receiver inside the frame is gone. Nothing about the
 * page looks broken when that happens — the frame keeps showing its last paint,
 * so the merchant sees a preview that has quietly stopped agreeing with the
 * controls beside it, and only a reload brings it back. That was a real bug
 * (the receiver was gated on a URL param the frame's own links dropped, now
 * `isPreviewSession`); this is the net under the next cause of it.
 *
 * **Armed only once the frame has applied something.** Before that, silence is
 * an ordinary cold start — a first compile in dev outlasts any timeout worth
 * setting here, and reloading then makes it slower rather than better.
 */
export function usePreviewWatchdog({
  armed,
  signal,
  onStale,
  delayMs = 2000,
  maxAttempts = 3,
}: {
  /** Has the frame applied a draft yet? The watchdog is off until it has. */
  armed: boolean;
  /**
   * Changes on every post — the `post` callback's identity does this, since it
   * is rebuilt per draft edit. It is what re-arms the timer.
   */
  signal: unknown;
  /** Reload the frame. Called at most `maxAttempts` times without a recovery. */
  onStale: () => void;
  delayMs?: number;
  /**
   * How many reloads a frame that NEVER answers is worth. The cap exists to
   * stop a cycle, not to ration recoveries: one acknowledgement resets it.
   */
  maxAttempts?: number;
}) {
  const acked = useRef(true);
  const attempts = useRef(0);

  const markPosted = useCallback(() => {
    acked.current = false;
  }, []);

  const markAcked = useCallback(() => {
    acked.current = true;
    attempts.current = 0;
  }, []);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => {
      // A hidden tab's frame is throttled, not broken — its reply is late by
      // design, and reloading would throw away the merchant's place in a page
      // they are not even looking at.
      if (acked.current || document.hidden) return;
      if (attempts.current >= maxAttempts) return;
      attempts.current += 1;
      onStale();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [armed, signal, onStale, delayMs, maxAttempts]);

  return { markPosted, markAcked };
}
