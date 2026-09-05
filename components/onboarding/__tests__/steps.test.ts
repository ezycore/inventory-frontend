import { describe, expect, it } from "vitest";
import type { OrganizationFeatures } from "@/types";
import { DEFAULT_ORGANIZATION_FEATURES } from "@/types";
import {
  QUESTION_COUNT,
  QUESTION_KEYS,
  answersFromProgress,
  askedIndices,
  nextAskedIndex,
  previousAskedIndex,
  isConfidentAbout,
  payloadForStep,
  isQuestionSkipped,
  recommendationsFor,
  toVatAnswer,
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
    const p = payloadForStep(5, withAnswers({ vat: "standard_15" }));

    expect(p.features).toEqual({ tax: true });
    expect(p.vatRegistration).toEqual({ type: "standard_15" });
  });

  it("keeps tax ON for turnover tax, which is still a registration", () => {
    // turnover_4 pays 4% of gross and issues invoices with no VAT line — that
    // is a registration state, not "no tax". Sending tax:false here would lose
    // the distinction entirely.
    const p = payloadForStep(5, withAnswers({ vat: "turnover_4" }));

    expect(p.features).toEqual({ tax: true });
    expect(p.vatRegistration).toEqual({ type: "turnover_4" });
  });

  it("turns tax off only when the business is not registered", () => {
    const p = payloadForStep(5, withAnswers({ vat: "unregistered" }));

    expect(p.features).toEqual({ tax: false });
    expect(p.vatRegistration).toEqual({ type: "unregistered" });
  });

  it("never sends a bare boolean without a registration type", () => {
    // An org with tax on and no history resolves to standard 15%, which would
    // silently mis-invoice a turnover-tax merchant.
    for (const vat of ["unregistered", "standard_15", "reduced", "turnover_4"] as const) {
      expect(payloadForStep(5, { vat }).vatRegistration).toBeDefined();
    }
  });
});

describe("remaining steps", () => {
  it("maps each question to its own flag", () => {
    expect(payloadForStep(1, { inventoryTracking: true }).features).toEqual({
      inventoryTracking: true,
    });
    expect(payloadForStep(3, { accounts: true }).features).toEqual({
      accounts: true,
    });
    expect(payloadForStep(4, { multiLocation: true }).features).toEqual({
      multiLocation: true,
    });
    expect(payloadForStep(6, { expiryTracking: false }).features).toEqual({
      expiryTracking: false,
    });
    expect(payloadForStep(7, { barcodeSystem: true }).features).toEqual({
      barcodeSystem: true,
    });
  });

  it("cannot enable purchasing without stock, whatever the answer says", () => {
    // The purchasing question is skipped for a stock-free merchant, but the
    // payload still writes the key — silence in the wizard must not leave a
    // capability on. Receiving goods writes stock; there is nowhere to put it.
    expect(
      payloadForStep(2, { inventoryTracking: false, purchases: true }).features,
    ).toEqual({ purchases: false });
    expect(
      payloadForStep(2, { inventoryTracking: true, purchases: true }).features,
    ).toEqual({ purchases: true });
  });

  it("treats an unanswered toggle as off rather than undefined", () => {
    expect(payloadForStep(4, {}).features).toEqual({ multiLocation: false });
  });

  it("carries a 1-based step on every question", () => {
    for (let i = 0; i < QUESTION_COUNT; i++) {
      expect(payloadForStep(i, {}).step).toBe(i + 1);
    }
  });
});

describe("skipping questions nobody needs to answer", () => {
  const allGranted = undefined; // no plan info = assume everything is granted

  it("skips purchasing, expiry and a second location once stock is declined", () => {
    // Four questions the merchant's own previous answer already settled. Asking
    // any of them invites an answer the system would then have to override,
    // which is how a setup flow starts feeling like it is not listening.
    const noStock = { inventoryTracking: false };
    expect(isQuestionSkipped(2, noStock, allGranted)).toBe(true);
    expect(isQuestionSkipped(4, noStock, allGranted)).toBe(true);
    expect(isQuestionSkipped(6, noStock, allGranted)).toBe(true);
  });

  it("asks them all when stock IS kept", () => {
    const withStock = { inventoryTracking: true };
    expect(isQuestionSkipped(2, withStock, allGranted)).toBe(false);
    expect(isQuestionSkipped(4, withStock, allGranted)).toBe(false);
    expect(isQuestionSkipped(6, withStock, allGranted)).toBe(false);
  });

  it("skips a question the PLAN has already settled", () => {
    // A tier that does not grant stock leaves nothing to ask: the merchant
    // cannot say yes, and a question they are not allowed to answer is worse
    // than no question at all.
    const plan = { ...DEFAULT_ORGANIZATION_FEATURES, inventoryTracking: false };
    expect(isQuestionSkipped(1, {}, plan)).toBe(true);
    // ...and the ones that hang off it go too, by the same reasoning.
    expect(isQuestionSkipped(2, {}, plan)).toBe(true);
  });

  it("never skips the channel question", () => {
    // Where you sell is the one thing every merchant must answer — there is no
    // plan or previous answer that can settle it for them.
    expect(isQuestionSkipped(0, { inventoryTracking: false }, allGranted)).toBe(
      false,
    );
  });

  it("asks about barcodes even with no counter and no stock", () => {
    // Tried skipping this for the f-commerce merchant and reverted it.
    // `barcodeSystem` looks like a till feature but also gates the `barcode`
    // field on the product form, its table and import/export columns, and one
    // of the three fields product search matches on. There is no SKU, so
    // barcode IS the product code — switching it off leaves the catalogue with
    // no reference number at all. Only the plan may settle this one.
    const fcommerce = { channel: "online" as const, inventoryTracking: false };
    expect(isQuestionSkipped(7, fcommerce, allGranted)).toBe(false);

    const plan = { ...DEFAULT_ORGANIZATION_FEATURES, barcodeSystem: false };
    expect(isQuestionSkipped(7, fcommerce, plan)).toBe(true);
  });

  it("keeps the common path short", () => {
    // The whole reason skipping exists. A storefront-only merchant answers
    // channel, stock, money, VAT and barcode — five, which is the point at
    // which setup flows start being abandoned.
    const answers = { inventoryTracking: false };
    const asked = Array.from({ length: QUESTION_COUNT }, (_, i) => i).filter(
      (i) => !isQuestionSkipped(i, answers, allGranted),
    );
    expect(asked.length).toBeLessThanOrEqual(5);
  });
});

/**
 * Walking over the skips.
 *
 * These exist because the wizard shipped with a five-entry screen array beside
 * an eight-case payload switch: step 2 rendered the locations card while saving
 * `inventoryTracking`, and step 6 rendered nothing at all — a blank page under a
 * "Step 6 of 8" bar. Type-checked, tested, and completely broken. The screens
 * are now keyed off `QUESTION_KEYS`, which is what these assert against.
 */
describe("navigating past skipped questions", () => {
  const allGranted = undefined;
  const noStock = { inventoryTracking: false };

  it("has exactly one key per question, in payload order", () => {
    // `payloadForStep` and the page's screen record are both indexed through
    // this list. If it drifts from `QUESTION_COUNT` the two halves of the
    // wizard disagree about what question the merchant is looking at.
    expect(QUESTION_KEYS).toHaveLength(QUESTION_COUNT);
    expect(new Set(QUESTION_KEYS).size).toBe(QUESTION_COUNT);
    expect(QUESTION_KEYS[1]).toBe("stock");
    expect(QUESTION_KEYS[5]).toBe("vat");
  });

  it("steps over the three questions a stock-free merchant closed", () => {
    // Stock is question 1; purchasing (2) is closed by the answer, so the next
    // screen is money (3). Landing on 2 renders nothing.
    expect(nextAskedIndex(2, noStock, allGranted)).toBe(3);
    // Money answered → locations (4) is closed too, so VAT (5) is next.
    expect(nextAskedIndex(4, noStock, allGranted)).toBe(5);
    // VAT answered → expiry (6) is closed, so barcode (7) is next.
    expect(nextAskedIndex(6, noStock, allGranted)).toBe(7);
  });

  it("returns the review when every remaining question is skipped", () => {
    // Not a failure: a plan granting nothing past barcode still has to reach
    // the summary rather than sit on a screen that does not exist.
    const plan = {
      ...DEFAULT_ORGANIZATION_FEATURES,
      barcodeSystem: false,
    };
    expect(nextAskedIndex(7, noStock, plan)).toBe(QUESTION_COUNT);
  });

  it("walks Back to a question that was actually asked", () => {
    // Back from VAT (5) for a stock-free merchant: locations (4) is skipped, so
    // it must land on money (3). Stepping by one blanks the screen, and Back is
    // the merchant's only recovery from a mistap.
    expect(previousAskedIndex(4, noStock, allGranted)).toBe(3);
    // Back from money (3): purchasing (2) and stock… stock is still asked.
    expect(previousAskedIndex(2, noStock, allGranted)).toBe(1);
  });

  it("reports the welcome screen when nothing is behind the first question", () => {
    expect(previousAskedIndex(-1, {}, allGranted)).toBe(-1);
    const plan = { ...DEFAULT_ORGANIZATION_FEATURES, inventoryTracking: false };
    // Only the channel question sits before money, so Back from it is welcome.
    expect(previousAskedIndex(0, {}, plan)).toBe(0);
  });

  it("counts the questions this merchant sees, not the eight that exist", () => {
    // The progress label is built off this. "Step 6 of 8" on a five-question
    // flow promises three screens that never arrive.
    expect(askedIndices(noStock, allGranted)).toEqual([0, 1, 3, 5, 7]);
    expect(askedIndices({ inventoryTracking: true }, allGranted)).toHaveLength(
      QUESTION_COUNT,
    );
  });

  it("never walks a resumed merchant onto a question with no screen", () => {
    // The server counts steps it was told about, so a resume point can name a
    // question a later answer has since closed. Every index the page can
    // resume from must resolve to one that is asked, or to the review.
    const asked = askedIndices(noStock, allGranted);
    for (let start = 0; start <= QUESTION_COUNT; start++) {
      const landed = nextAskedIndex(start, noStock, allGranted);
      expect(landed === QUESTION_COUNT || asked.includes(landed)).toBe(true);
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

  // Half a baby shop's shelf is dated stock — formula, baby food, wipes,
  // creams — so this trade gets expiry ON even though the other half is
  // clothing, which is the reason it is not a shape of FASHION_APPAREL.
  it("recommends expiry and barcode for a baby & kids store", () => {
    expect(recommendationsFor("BABY_KIDS_STORE")).toEqual({
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

/**
 * Reading a resumed wizard's answers back off the workspace.
 *
 * The input is `featureOverrides` — the merchant's OWN explicit disables, sparse
 * so an absent key means "on". Not `features`, which is derived: it folds in the
 * plan ceiling and the dependency cascade, so it reports capabilities as off
 * that nobody chose to switch off. See `answersFromProgress`.
 *
 * The gate is the step count, never the values: overrides start empty, so an
 * absent key is ambiguous between "answered yes" and "never asked".
 */
/** Sparse override map — list only what the merchant explicitly turned OFF. */
const chose = (off: Partial<OrganizationFeatures>) => off;

describe("restoring a resumed wizard's answers", () => {
  it("restores nothing at step 0 — nothing has been answered yet", () => {
    expect(answersFromProgress(chose({}), 0, "standard_15")).toEqual({});
  });

  it("restores only the questions the server counted as answered", () => {
    const restored = answersFromProgress(chose({ storefront: false }), 2, "standard_15");

    expect(restored).toEqual({ channel: "shop", inventoryTracking: true });
    expect(restored.vat).toBeUndefined();
  });

  it("reads the channel back off both features it wrote", () => {
    const channelAt = (sales: boolean, storefront: boolean) =>
      answersFromProgress(
        chose({
          ...(sales ? {} : { sales: false }),
          ...(storefront ? {} : { storefront: false }),
        }),
        1,
        undefined,
      ).channel;

    expect(channelAt(true, false)).toBe("shop");
    expect(channelAt(false, true)).toBe("online");
    expect(channelAt(true, true)).toBe("both");
  });

  it("restores the VAT registration, not the tax flag", () => {
    // The flag says a registration was declared; only the registration itself
    // says which of the four it was.
    expect(answersFromProgress(chose({}), 6, "turnover_4").vat).toBe("turnover_4");
    expect(
      answersFromProgress(chose({ tax: false }), 6, "standard_15").vat,
    ).toBe("unregistered");
  });

  it("leaves VAT unanswered for a registration the wizard cannot offer", () => {
    // `exempt` is a real registration with no option on that screen — better an
    // unselected question than a wrong answer pre-filled.
    expect(toVatAnswer("exempt")).toBeUndefined();
    expect(answersFromProgress(chose({}), 6, toVatAnswer("exempt")).vat).toBeUndefined();
  });

  it("restores nothing while the overrides are still loading", () => {
    expect(answersFromProgress(undefined, 4, "standard_15")).toEqual({});
  });

  /**
   * The bug this signature change exists to prevent, and the reason it is worth
   * a test of its own: it loses data silently and irreversibly.
   */
  it("does not report a CASCADE-suppressed capability as the merchant's answer", () => {
    // A merchant who answered "no stock" and nothing else. The cascade turns
    // `expiryTracking`, `combo`, `uomConversion`, `multiLocation` and
    // `purchases` off in the DERIVED map — but they chose none of that, and
    // their override map says so by staying silent about them.
    const restored = answersFromProgress(
      chose({ inventoryTracking: false }),
      QUESTION_COUNT,
      "standard_15",
    );

    expect(restored.inventoryTracking).toBe(false);
    // Read off `features` instead and these come back `false`, the wizard
    // pre-fills "no", and advancing writes them as explicit disables — replacing
    // the merchant's intent with the cascade's own suppression, after which
    // turning stock back on restores nothing.
    //
    // `undefined` rather than `true` for all three: none of them was ASKED,
    // because "no stock" closes the question. An unasked question has no
    // override, and an absent override reads as "yes" — so restoring it as
    // `true` puts an answer on screen that the merchant never gave. It shows up
    // the moment they resume and turn stock back on: the locations question
    // arrives with "More than one" already selected. Absent is the honest
    // reading, and it is what `purchases` has always returned here.
    expect(restored.expiryTracking).toBeUndefined();
    expect(restored.multiLocation).toBeUndefined();
    expect(restored.purchases).toBeUndefined();
  });

  it("restores an explicit disable as the answer it was", () => {
    const restored = answersFromProgress(
      chose({ expiryTracking: false, barcodeSystem: false }),
      QUESTION_COUNT,
      "reduced",
    );
    expect(restored).toMatchObject({
      channel: "both",
      inventoryTracking: true,
      accounts: true,
      multiLocation: true,
      vat: "reduced",
      expiryTracking: false,
      barcodeSystem: false,
    });
  });
});
