// coding-standard: maintained
import { useEffect, useRef } from "react";

export interface PosShortcutHandlers {
  /** F2 — the scan/search box. */
  focusSearch: () => void;
  /** F4 — the customer picker. */
  focusCustomer: () => void;
  /** F8 — Confirm order. */
  confirm: () => void;
}

const KEYS: Record<string, keyof PosShortcutHandlers> = {
  F2: "focusSearch",
  F4: "focusCustomer",
  F8: "confirm",
};

/**
 * The counter's keyboard shortcuts. Deliberately only F2/F4/F8: the browser
 * owns F1 (help), F3 (find), F5 (reload), F6 (address bar), F7 (caret
 * browsing), F11 (full screen) and F12 (devtools), and a cashier who hits
 * reload mid-sale is worse off than one without a shortcut.
 */
export function usePosShortcuts(handlers: PosShortcutHandlers) {
  const latest = useRef(handlers);

  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = KEYS[event.key];
      if (!action) return;
      event.preventDefault();
      latest.current[action]();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
