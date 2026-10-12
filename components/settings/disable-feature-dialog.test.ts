// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { disableConsequence } from "./disable-feature-dialog";

const t = ((key: string) => key) as never;

describe("disableConsequence", () => {
  it("always warns before Courier payouts goes off — even before the impact counts load", () => {
    // Off and on again restarts every courier balance (backend `courierPayoutsSince`).
    expect(disableConsequence("courierPayouts", undefined, t)).toBe("disable.courierPayouts");
  });

  it("still says nothing for a switch with nothing at stake", () => {
    expect(disableConsequence("barcodeSystem", undefined, t)).toBeNull();
  });
});
