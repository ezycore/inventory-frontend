// coding-standard: maintained
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MerchantAlert } from "@/services/api";
import { useAlertChime } from "./use-alert-chime";

/**
 * The bell rings for what is NEW — never for what was already there on load, and once across
 * tabs (the last rung time is shared through localStorage).
 */
const shown: string[] = [];
class FakeNotification {
  static permission: NotificationPermission = "granted";
  static requestPermission = vi.fn(async () => "granted" as NotificationPermission);
  onclick: (() => void) | null = null;
  constructor(title: string) {
    shown.push(title);
  }
  close() {}
}

const alert = (id: string, createdAt: string): MerchantAlert => ({
  _id: id,
  eventKey: "order.placed",
  data: {},
  link: { kind: "order", id },
  createdAt,
  read: false,
});

const describeAlert = (a: MerchantAlert) => ({ title: `alert ${a._id}`, body: "" });

beforeEach(() => {
  shown.length = 0;
  localStorage.clear();
  localStorage.setItem("ezy-bell-prefs", JSON.stringify({ sound: false, popup: true }));
  vi.stubGlobal("Notification", FakeNotification);
});
afterEach(() => vi.unstubAllGlobals());

const mount = (initial: MerchantAlert[]) =>
  renderHook(({ alerts }) => useAlertChime(alerts, describeAlert, () => {}), {
    initialProps: { alerts: initial },
  });

describe("useAlertChime", () => {
  it("stays quiet on the first load, then pops up for an alert that arrives", () => {
    const old = alert("a1", "2026-10-25T04:00:00.000Z");
    const { rerender } = mount([old]);
    expect(shown).toEqual([]);

    act(() => rerender({ alerts: [alert("a2", "2026-10-25T04:05:00.000Z"), old] }));
    expect(shown).toEqual(["alert a2"]);

    // The next poll brings nothing new — no second pop-up.
    act(() => rerender({ alerts: [alert("a2", "2026-10-25T04:05:00.000Z"), old] }));
    expect(shown).toEqual(["alert a2"]);
  });

  it("a second tab that sees the same alert later does not ring it again", () => {
    const old = alert("a1", "2026-10-25T04:00:00.000Z");
    const fresh = alert("a2", "2026-10-25T04:05:00.000Z");
    const tabA = mount([old]);
    const tabB = mount([old]);
    act(() => tabA.rerender({ alerts: [fresh, old] }));
    act(() => tabB.rerender({ alerts: [fresh, old] }));
    expect(shown).toEqual(["alert a2"]);
  });

  it("no pop-up while it is switched off", () => {
    localStorage.setItem("ezy-bell-prefs", JSON.stringify({ sound: false, popup: false }));
    const old = alert("a1", "2026-10-25T04:00:00.000Z");
    const { rerender } = mount([old]);
    act(() => rerender({ alerts: [alert("a2", "2026-10-25T04:05:00.000Z"), old] }));
    expect(shown).toEqual([]);
  });
});
