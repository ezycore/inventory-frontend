import { describe, expect, it } from "vitest";
import {
  QUESTION_COUNT,
  isConfidentAbout,
  payloadForStep,
  recommendationsFor,
  type OnboardingAnswers,
} from "../steps";

/**
 * The wizard's answer → payload mapping. This is where a wrong translation is
 * expensive: step 1 decides two features at once, and step 3 decides how every
 * future invoice is taxed.
 */

const withAnswers = (a: OnboardingAnswers) => a;

describe("step 1 — how do you sell", () => {
  it("shop only turns the storefront off, keeping the POS", () => {
    const p = payloadForStep(0, withAnswers({ channel: "shop" }));

    expect(p.features).toEqual({ sales: true, storefront: false });
  });

  it("online only turns the POS off, keeping the storefront", () => {
    const p = payloadForStep(0, withAnswers({ channel: "online" }));

    expect(p.features).toEqual({ sales: false, storefront: true });
  });

  it("both keeps each channel on", () => {
    const p = payloadForStep(0, withAnswers({ channel: "both" }));

    expect(p.features).toEqual({ sales: true, storefront: true });
  });

  it("sets two features from one question", () => {
    // The merge that makes this five questions instead of six.
    expect(Object.keys(payloadForStep(0, { channel: "both" }).features ?? {}))
      .toHaveLength(2);
  });
});

describe("step 3 — VAT", () => {
  it("records a dated registration alongside the feature flag", () => {
    const p = payloadForStep(2, withAnswers({ vat: "standard_15" }));

    expect(p.features).toEqual({ tax: true });
    expect(p.vatRegistration).toEqual({ type: "standard_15" });
  });

  it("keeps tax ON for turnover tax, which is still a registration", () => {
    // turnover_4 pays 4% of gross and issues invoices with no VAT line — that
    // is a registration state, not "no tax". Sending tax:false here would lose
    // the distinction entirely.
    const p = payloadForStep(2, withAnswers({ vat: "turnover_4" }));

    expect(p.features).toEqual({ tax: true });
    expect(p.vatRegistration).toEqual({ type: "turnover_4" });
  });

  it("turns tax off only when the business is not registered", () => {
    const p = payloadForStep(2, withAnswers({ vat: "unregistered" }));

    expect(p.features).toEqual({ tax: false });
    expect(p.vatRegistration).toEqual({ type: "unregistered" });
  });

  it("never sends a bare boolean without a registration type", () => {
    // An org with tax on and no history resolves to standard 15%, which would
    // silently mis-invoice a turnover-tax merchant.
    for (const vat of ["unregistered", "standard_15", "reduced", "turnover_4"] as const) {
      expect(payloadForStep(2, { vat }).vatRegistration).toBeDefined();
    }
  });
});

describe("remaining steps", () => {
  it("maps locations, expiry and barcode to their own flags", () => {
    expect(payloadForStep(1, { multiLocation: true }).features).toEqual({
      multiLocation: true,
    });
    expect(payloadForStep(3, { expiryTracking: false }).features).toEqual({
      expiryTracking: false,
    });
    expect(payloadForStep(4, { barcodeSystem: true }).features).toEqual({
      barcodeSystem: true,
    });
  });

  it("treats an unanswered toggle as off rather than undefined", () => {
    expect(payloadForStep(1, {}).features).toEqual({ multiLocation: false });
  });

  it("carries a 1-based step on every question", () => {
    for (let i = 0; i < QUESTION_COUNT; i++) {
      expect(payloadForStep(i, {}).step).toBe(i + 1);
    }
  });
});

describe("industry recommendations", () => {
  it("recommends expiry and barcode for a pharmacy", () => {
    expect(recommendationsFor("PHARMACY")).toEqual({
      expiryTracking: true,
      barcodeSystem: true,
    });
  });

  it("recommends neither for an online shop", () => {
    expect(recommendationsFor("ONLINE_SHOP")).toEqual({
      expiryTracking: false,
      barcodeSystem: false,
    });
  });

  it("falls back to off for an unknown or missing industry", () => {
    expect(recommendationsFor("SOMETHING_NEW")).toEqual({
      expiryTracking: false,
      barcodeSystem: false,
    });
    expect(recommendationsFor(undefined)).toEqual({
      expiryTracking: false,
      barcodeSystem: false,
    });
  });

  it("only phrases a question as a confirmation where the signal is strong", () => {
    expect(isConfidentAbout("PHARMACY", "expiryTracking")).toBe(true);
    expect(isConfidentAbout("ELECTRONICS_STORE", "expiryTracking")).toBe(false);
    expect(isConfidentAbout("ELECTRONICS_STORE", "barcodeSystem")).toBe(true);
  });
});
