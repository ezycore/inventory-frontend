// coding-standard: maintained
import type { OrganizationFeatures, VatRegistrationType } from "@/types";
import type { OnboardingStepPayload } from "@/services/api/modules/organization/api";

/**
 * The setup wizard's question set.
 *
 * The admission test is *"does this feature meaningfully change how the
 * merchant uses or configures Ezycore?"* — not "does it add a sidebar item",
 * which is too narrow and wrongly excludes Barcode and Expiry Tracking. Bundles
 * and unit conversion fail the test and are left to the review screen; business
 * type and shop address are already collected at signup
 * (docs/plan/onboarding-workspace.md §5).
 *
 * Every feature starts ON, so an answer's job is to write explicit `false` for
 * what the business does not need.
 */

export type ChannelAnswer = "shop" | "online" | "both";

export type VatAnswer =
  | "unregistered"
  | "standard_15"
  | "reduced"
  | "turnover_4";

export interface OnboardingAnswers {
  channel?: ChannelAnswer;
  /** "Do you keep stock?" — the tier boundary, and the parent of four others. */
  inventoryTracking?: boolean;
  /** "Do you buy to resell?" — only asked when stock is kept. */
  purchases?: boolean;
  /** "Do you track money in EzyCore?" */
  accounts?: boolean;
  multiLocation?: boolean;
  vat?: VatAnswer;
  expiryTracking?: boolean;
  barcodeSystem?: boolean;
}

/** Feature keys the review screen shows but no question asks about. */
export const REVIEW_ONLY_FEATURES: (keyof OrganizationFeatures)[] = [
  "returns",
  "invoicePrinting",
  "uomConversion",
  // `smsNotifications` is deliberately NOT here. "Customize workspace" excludes
  // it on purpose — it costs real money per message and is configured with its
  // credit balance under Notifications — so a switch on this screen was a
  // one-way door: a merchant who turned it off during setup had nowhere to turn
  // it back on. Every other feature on this screen has a permanent home.
];

/** Feature keys the questions decide, in the order they are asked. */
export const ANSWERED_FEATURES: (keyof OrganizationFeatures)[] = [
  "sales",
  "storefront",
  "inventoryTracking",
  "purchases",
  "accounts",
  "multiLocation",
  "tax",
  "expiryTracking",
  "barcodeSystem",
];

/**
 * Recommended starting positions by industry. These **pre-fill** the toggles —
 * they are never applied without the merchant confirming, because two shops in
 * the same trade can work completely differently (§5.7).
 */
const INDUSTRY_RECOMMENDATIONS: Record<
  string,
  { expiryTracking: boolean; barcodeSystem: boolean }
> = {
  PHARMACY: { expiryTracking: true, barcodeSystem: true },
  GROCERY_STORE: { expiryTracking: true, barcodeSystem: true },
  RESTAURANT_FNB: { expiryTracking: true, barcodeSystem: false },
  ELECTRONICS_STORE: { expiryTracking: false, barcodeSystem: true },
  FASHION_APPAREL: { expiryTracking: false, barcodeSystem: true },
  // Expiry ON is the point of the category: formula, baby food, wipes and
  // creams are all dated, and a shop that misses one is selling expired food to
  // an infant. That it also sells clothes does not soften it.
  BABY_KIDS_STORE: { expiryTracking: true, barcodeSystem: true },
  WHOLESALE_DISTRIBUTOR: { expiryTracking: false, barcodeSystem: true },
  ONLINE_SHOP: { expiryTracking: false, barcodeSystem: false },
};

export function recommendationsFor(industry?: string) {
  return (
    INDUSTRY_RECOMMENDATIONS[industry ?? ""] ?? {
      expiryTracking: false,
      barcodeSystem: false,
    }
  );
}

/**
 * Whether the industry signal is strong enough to phrase a question as a
 * confirmation ("Pharmacies usually track expiry dates") rather than a neutral
 * ask. Only the recommended-ON cases earn that phrasing.
 */
export function isConfidentAbout(
  industry: string | undefined,
  key: "expiryTracking" | "barcodeSystem",
): boolean {
  return recommendationsFor(industry)[key];
}

/** One question's answer → the payload the backend applies for that step. */
export function payloadForStep(
  stepIndex: number,
  answers: OnboardingAnswers,
): OnboardingStepPayload {
  const step = stepIndex + 1;

  // Switched on the key rather than the ordinal so that reordering
  // `QUESTION_KEYS` moves a question without silently re-pointing its payload
  // at the neighbour's feature.
  switch (QUESTION_KEYS[stepIndex]) {
    case "channel":
      return {
        step,
        features: {
          // "sales" is the POS capability — the counter, not the ledger.
          sales: answers.channel !== "online",
          storefront: answers.channel !== "shop",
        },
      };
    case "stock":
      // The tier boundary, and the parent of four other capabilities. Answering
      // "no" here suppresses purchases, expiry, bundles, unit conversion and
      // multi-location through `FEATURE_REQUIRES` — derived, never written, so
      // answering "yes" later brings each back as the merchant left it.
      return {
        step,
        features: { inventoryTracking: !!answers.inventoryTracking },
      };
    case "purchases":
      // Skipped entirely when there is no stock — see `isQuestionSkipped`. The
      // payload still writes the key so a merchant who changes their mind about
      // stock does not carry a stale purchasing answer, but it writes the only
      // value that can be true: buying to resell requires somewhere to receive
      // into.
      return {
        step,
        features: {
          purchases: !!answers.inventoryTracking && !!answers.purchases,
        },
      };
    case "accounts":
      return { step, features: { accounts: !!answers.accounts } };
    case "locations":
      return { step, features: { multiLocation: !!answers.multiLocation } };
    case "vat":
      return {
        step,
        features: { tax: answers.vat !== "unregistered" },
        // Dated registration, never a bare boolean: an org with tax on and no
        // history resolves to standard 15%, which would put VAT on the invoices
        // of a turnover-tax merchant who should carry none (§5.6).
        vatRegistration: { type: answers.vat ?? "unregistered" },
      };
    case "expiry":
      return { step, features: { expiryTracking: !!answers.expiryTracking } };
    case "barcode":
      return { step, features: { barcodeSystem: !!answers.barcodeSystem } };
    default:
      return { step };
  }
}

/**
 * The questions, in the order they are asked.
 *
 * This list is the single source of both the count and the ordering, and the
 * page builds its screens as a `Record<QuestionKey, ReactNode>` keyed off it —
 * so a question added here without a screen is a type error.
 *
 * That indirection is not ceremony. The page previously held a positional
 * array of screens next to `payloadForStep`'s positional switch, with nothing
 * tying the two together: adding three questions to the switch left the array
 * at five, so step 2 rendered the locations card while writing
 * `inventoryTracking`, and step 6 rendered `undefined` — a blank page under a
 * "Step 6 of 8" progress bar. Both halves type-checked.
 */
export const QUESTION_KEYS = [
  "channel",
  "stock",
  "purchases",
  "accounts",
  "locations",
  "vat",
  "expiry",
  "barcode",
] as const;

export type QuestionKey = (typeof QUESTION_KEYS)[number];

/**
 * How many questions precede the review screen.
 *
 * Eight exist; a given merchant sees far fewer. `isQuestionSkipped` drops any
 * question the plan has already settled and any question a previous answer has
 * closed — a merchant with no stock is never asked about purchasing, expiry,
 * bundles or a second location, because their own answer already decided all
 * four. The common path stays at five or under, which is where setup flows
 * start being abandoned.
 */
export const QUESTION_COUNT = QUESTION_KEYS.length;

/**
 * Should this question be skipped for this merchant?
 *
 * Two independent reasons, and both are about not asking a question whose
 * answer is already known:
 *
 * - **The plan settled it.** A tier that does not grant `inventoryTracking`
 *   leaves nothing to ask — the merchant cannot say yes, and being shown a
 *   question they are not allowed to answer is worse than not being asked.
 * - **A previous answer closed it.** "Do you buy to resell?" only arises for a
 *   business that keeps stock; asking it after "no stock" invites an answer the
 *   system will then have to override.
 *
 * Skipped questions are still WRITTEN by `featuresForStep`, at the value their
 * parent implies. Silence in the wizard must not leave a stale capability on.
 */
export function isQuestionSkipped(
  stepIndex: number,
  answers: OnboardingAnswers,
  planFeatures: OrganizationFeatures | undefined,
): boolean {
  const granted = (key: keyof OrganizationFeatures) =>
    planFeatures ? planFeatures[key] === true : true;

  /**
   * Stock-dependent questions, which are unanswerable in two ways rather than
   * one: the plan may withhold the capability itself, OR it may withhold the
   * stock it depends on — in which case the cascade would suppress it anyway
   * and the question could only ever be answered wrong. Mirrors
   * `FEATURE_REQUIRES` on the backend.
   */
  const needsStock = (key: keyof OrganizationFeatures) =>
    !granted(key) ||
    !granted("inventoryTracking") ||
    answers.inventoryTracking === false;

  switch (QUESTION_KEYS[stepIndex]) {
    case "stock":
      return !granted("inventoryTracking");
    case "purchases":
      return needsStock("purchases");
    case "accounts":
      return !granted("accounts");
    case "locations":
      return needsStock("multiLocation");
    case "expiry":
      return needsStock("expiryTracking");
    case "barcode":
      // Deliberately NOT stock-gated, and deliberately not counter-gated
      // either — this was tried and reverted.
      //
      // `barcodeSystem` reads like a till feature, and its two routes
      // (`/products/lookup`, `/products/labels/image`) reinforce that. It is
      // not: it also gates the `barcode` field on the product form, the barcode
      // column in the table and in import/export, and one of the three fields
      // product search matches on. There is no SKU — `product.model.ts` has no
      // code field of any kind — so barcode IS the product's identifier.
      //
      // Switch it off for a merchant with no counter and no stock and their
      // products lose their only reference number: nothing to search by,
      // nothing on a packing slip, nothing to round-trip an export through. An
      // f-commerce seller printing parcel labels wants it as much as a shop
      // does. The plan grant is the only thing that can settle this question.
      return !granted("barcodeSystem");
    default:
      return false;
  }
}

/**
 * Walking the flow with the skips honoured.
 *
 * Every move through the wizard — forward, back, and the resume jump the page
 * makes off `onboardingStep` — has to step *over* skipped questions rather than
 * land on one. Landing on one renders nothing, because a skipped question has
 * no screen: that is the blank page, and it is reachable three separate ways,
 * which is why the walk lives here once instead of at each call site.
 *
 * `nextAskedIndex` returning `QUESTION_COUNT` is not a failure — it means the
 * remaining questions are all skipped, and the review screen is next.
 * `previousAskedIndex` returning `-1` means the welcome screen is behind us.
 */
export function nextAskedIndex(
  from: number,
  answers: OnboardingAnswers,
  planFeatures: OrganizationFeatures | undefined,
): number {
  let index = Math.max(0, from);
  while (index < QUESTION_COUNT && isQuestionSkipped(index, answers, planFeatures)) {
    index += 1;
  }
  return index;
}

export function previousAskedIndex(
  from: number,
  answers: OnboardingAnswers,
  planFeatures: OrganizationFeatures | undefined,
): number {
  let index = Math.min(from, QUESTION_COUNT - 1);
  while (index >= 0 && isQuestionSkipped(index, answers, planFeatures)) {
    index -= 1;
  }
  return index;
}

/**
 * The questions this merchant is asked, as positions in `QUESTION_KEYS`.
 *
 * The progress label counts these, not all eight. "Step 6 of 8" on a flow that
 * only ever asks five is a promise of three questions that never arrive — and
 * it is what the merchant sees at the exact moment they are wondering how much
 * longer this takes.
 */
export function askedIndices(
  answers: OnboardingAnswers,
  planFeatures: OrganizationFeatures | undefined,
): number[] {
  return QUESTION_KEYS.map((_, index) => index).filter(
    (index) => !isQuestionSkipped(index, answers, planFeatures),
  );
}

/**
 * The four registrations the wizard offers. `exempt` exists in
 * `VatRegistrationType` but is not asked here, so a workspace already carrying
 * it has no answer to re-select — better an unselected question than a wrong
 * one pre-filled.
 */
const WIZARD_VAT_TYPES = [
  "unregistered",
  "standard_15",
  "reduced",
  "turnover_4",
] as const satisfies readonly VatAnswer[];

export function toVatAnswer(
  type: VatRegistrationType | undefined,
): VatAnswer | undefined {
  return WIZARD_VAT_TYPES.find((candidate) => candidate === type);
}

/**
 * The answers a resumed wizard already gave, read back off the workspace.
 *
 * Without this, `answers` starts empty on a resume and every question *behind*
 * the resume point renders with nothing selected — so a merchant who presses
 * Back sees their own answer missing and has to give it again.
 *
 * **Reads `featureOverrides`, NOT `features`.** That distinction is the whole
 * correctness of this function, and getting it wrong loses data rather than
 * merely looking wrong:
 *
 * `features` is the derived map — the plan ceiling AND the dependency cascade
 * folded in. A merchant who does not keep stock has `expiryTracking`, `combo`
 * and `uomConversion` suppressed there by the cascade, not by any answer they
 * gave. Read that map back and the wizard pre-fills "no" to questions they were
 * never asked; advance through the steps and each of those is written as an
 * explicit `false` override. Their real preferences are then overwritten by a
 * machine-generated disable, and turning stock back on restores *nothing*,
 * because the record of what they chose is gone. It also breaks the invariant
 * the override model rests on — that every stored `false` is merchant intent.
 *
 * `featureOverrides` is sparse and stores only explicit disables, so absent
 * means "yes" and a stored `false` means "no". That is exactly the shape of an
 * answer.
 *
 * `step` remains the gate, not the values: overrides start empty, so an absent
 * key is ambiguous between "answered yes" and "never asked". Only a question the
 * server counted as answered may be read back, which is what `onboardingStep`
 * records.
 */
export function answersFromProgress(
  overrides: Partial<OrganizationFeatures> | undefined,
  step: number,
  vat: VatAnswer | undefined,
): OnboardingAnswers {
  if (!overrides) return {};

  /** Sparse-map read: absent = the merchant left it on. */
  const on = (key: keyof OrganizationFeatures) => overrides[key] !== false;

  const answers: OnboardingAnswers = {};

  if (step > 0) {
    answers.channel = on("sales")
      ? on("storefront")
        ? "both"
        : "shop"
      : "online";
  }
  if (step > 1) answers.inventoryTracking = on("inventoryTracking");
  // Only meaningful when stock is kept — the question is skipped otherwise, so
  // reading it back for a stock-free merchant would surface an answer to a
  // question that was never put to them.
  if (step > 2 && on("inventoryTracking")) answers.purchases = on("purchases");
  if (step > 3) answers.accounts = on("accounts");
  // Stock-dependent, so guarded the same way purchasing is. The step counter
  // walks over skipped questions, so `step > 4` is true for a stock-free
  // merchant who was never shown this one — and an unasked question has no
  // override, which reads back as "yes". Without the guard a merchant who
  // resumes and then turns stock ON finds "More than one location" already
  // selected, an answer they never gave.
  if (step > 4 && on("inventoryTracking")) {
    answers.multiLocation = on("multiLocation");
  }
  if (step > 5) {
    // The registration is the answer; the `tax` flag only says whether one was
    // declared at all. Reading the flag alone would show "Standard rated" to a
    // turnover-tax merchant.
    const declared = on("tax") ? vat : "unregistered";
    if (declared) answers.vat = declared;
  }
  if (step > 6 && on("inventoryTracking")) {
    answers.expiryTracking = on("expiryTracking");
  }
  if (step > 7) answers.barcodeSystem = on("barcodeSystem");

  return answers;
}
