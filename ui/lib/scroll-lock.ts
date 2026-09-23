"use client";
// coding-standard: maintained

import { createContext, useContext } from "react";

/**
 * True below an overlay that locks page scrolling — Radix's dialog,
 * alert-dialog and sheet, each of which provides it from its content component.
 */
const ScrollLockContext = createContext(false);

export const ScrollLockProvider = ScrollLockContext.Provider;

/**
 * Is this component rendered inside an overlay that locks page scrolling?
 *
 * Ask before portalling a scrollable popover. The lock (`react-remove-scroll`)
 * listens for `wheel` and `touchmove` on `document` and cancels every one whose
 * target is neither inside the locked element nor in its shards — and Radix
 * shards only the overlay's own content node. A popover portalled to
 * `document.body` is a *sibling* of the overlay, so it is outside: the wheel,
 * the trackpad and a finger all do nothing over it, and the only thing that
 * still scrolls the list is dragging its scrollbar, because a pointer drag is
 * neither event. Rendered in place instead, the lock measures the list's own
 * scroll room and lets the event through.
 *
 * Nothing about the popover's POSITION depends on the portal — Radix's popper is
 * `position: fixed` either way. See `PopoverContent`'s `portal` prop.
 *
 * Context rather than a `closest()` walk from a ref: this answer is needed while
 * rendering the popover, reading a ref during render is impure (and the React
 * Compiler lint rules reject it), and a state-backed answer would arrive a
 * render too late. Context also follows the REACT tree, so a control that is
 * itself portalled out of the overlay still gets the right answer.
 */
export const useInsideScrollLock = (): boolean => useContext(ScrollLockContext);
