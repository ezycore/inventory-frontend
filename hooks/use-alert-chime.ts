"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";
import type { MerchantAlert } from "@/services/api";

/**
 * The bell's sound and browser pop-up (backend `docs/plan/notification-bell.md` D5–D6). Both are
 * this browser's choice, so they live in `localStorage` — a convenience, not shop state: a quiet
 * office PC mutes itself without muting the owner's laptop. Sound is on by default; the pop-up is
 * off until switched on, because turning it on asks the browser for permission.
 *
 * Rings for an alert newer than the last one rung on this device — never on the first load, and
 * once across tabs: every open tab polls, the first to see an alert stores its time, the rest
 * find it already rung.
 */

const PREFS_KEY = "ezy-bell-prefs";
const RUNG_KEY = "ezy-bell-last-rung";

export interface ChimePrefs {
  sound: boolean;
  popup: boolean;
}

const DEFAULT_PREFS: ChimePrefs = { sound: true, popup: false };

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private window or blocked storage: the setting lasts until the tab closes.
  }
};

const readPrefs = (): ChimePrefs => {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(read(PREFS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
};

const popupPermission = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

/** Two soft notes — no audio file to ship. Resolves false when the browser blocked sound. */
const playChime = async (): Promise<boolean> => {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return false;
    const audio = new Context();
    if (audio.state === "suspended") await audio.resume();
    if (audio.state !== "running") return false;
    [880, 1320].forEach((frequency, index) => {
      const start = audio.currentTime + index * 0.18;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.32);
    });
    window.setTimeout(() => void audio.close(), 1000);
    return true;
  } catch {
    return false;
  }
};

export function useAlertChime(
  alerts: MerchantAlert[] | undefined,
  describe: (alert: MerchantAlert) => { title: string; body: string },
  onOpen: (alert: MerchantAlert) => void,
) {
  // The header renders only after hydration, so browser storage can be read on the first render.
  const [prefs, setPrefs] = useState<ChimePrefs>(readPrefs);
  const [permission, setPermission] = useState(popupPermission);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const primed = useRef(false);

  const update = useCallback((next: Partial<ChimePrefs>) => {
    setPrefs((current) => {
      const merged = { ...current, ...next };
      write(PREFS_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  /** Switching the pop-up on asks the browser — only from a click, which is when it may ask. */
  const setPopup = useCallback(
    async (on: boolean) => {
      if (on && popupPermission() === "default") {
        const answer = await Notification.requestPermission();
        setPermission(answer);
        if (answer !== "granted") return;
      }
      update({ popup: on });
    },
    [update],
  );

  useEffect(() => {
    if (!alerts) return;
    const newest = alerts[0]?.createdAt ?? "";
    const lastRung = read(RUNG_KEY) ?? "";
    // First data on this device: remember where we are, ring nothing that was already there.
    if (!primed.current) {
      primed.current = true;
      if (!lastRung || newest > lastRung) write(RUNG_KEY, newest || new Date(0).toISOString());
      return;
    }
    const fresh = alerts.filter((alert) => !alert.read && alert.createdAt > lastRung);
    if (fresh.length === 0) return;
    write(RUNG_KEY, newest);

    if (prefs.sound) void playChime().then((played) => setSoundBlocked(!played));
    if (prefs.popup && popupPermission() === "granted") {
      try {
        for (const alert of fresh.slice(0, 3)) {
          const { title, body } = describe(alert);
          const popup = new Notification(title, { body, tag: alert._id });
          popup.onclick = () => {
            window.focus();
            onOpen(alert);
            popup.close();
          };
        }
      } catch {
        // Android Chrome has `Notification` and grants it, but the constructor throws — it only
        // shows pop-ups through a service worker, which this app has none of. Hide the switch.
        setPermission("unsupported");
      }
    }
  }, [alerts, prefs.sound, prefs.popup, describe, onOpen]);

  return { prefs, setSound: (on: boolean) => update({ sound: on }), setPopup, permission, soundBlocked };
}
