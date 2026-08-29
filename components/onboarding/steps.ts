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

  switch (stepIndex) {
    case 0:
      return {
        step,
        features: {
          // "sales" is the POS capability — the counter, not the ledger.
          sales: answers.channel !== "online",
          storefront: answers.channel !== "shop",
        },
      };
    case 1:
      return { step, features: { multiLocation: !!answers.multiLocation } };
    case 2:
      return {
        step,
        features: { tax: answers.vat !== "unregistered" },
        // Dated registration, never a bare boolean: an org with tax on and no
        // history resolves to standard 15%, which would put VAT on the invoices
        // of a turnover-tax merchant who should carry none (§5.6).
        vatRegistration: { type: answers.vat ?? "unregistered" },
      };
    case 3:
      return { step, features: { expiryTracking: !!answers.expiryTracking } };
    case 4:
      return { step, features: { barcodeSystem: !!answers.barcodeSystem } };
    default:
      return { step };
  }
}

/** How many questions precede the review screen. */
export const QUESTION_COUNT = 5;

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
 * `step` is the gate, not the feature values: every feature starts ON, so
 * `storefront: true` is ambiguous between "answered both" and "never asked".
 * Only a question the server counted as answered may be read back, which is
 * exactly what `onboardingStep` records.
 */
export function answersFromProgress(
  features: OrganizationFeatures | undefined,
  step: number,
  vat: VatAnswer | undefined,
): OnboardingAnswers {
  if (!features) return {};

  const answers: OnboardingAnswers = {};

  if (step > 0) {
    answers.channel = features.sales
      ? features.storefront
        ? "both"
        : "shop"
      : "online";
  }
  if (step > 1) answers.multiLocation = !!features.multiLocation;
  if (step > 2) {
    // The registration is the answer; the `tax` flag only says whether one was
    // declared at all. Reading the flag alone would show "Standard rated" to a
    // turnover-tax merchant.
    const declared = features.tax ? vat : "unregistered";
    if (declared) answers.vat = declared;
  }
  if (step > 3) answers.expiryTracking = !!features.expiryTracking;
  if (step > 4) answers.barcodeSystem = !!features.barcodeSystem;

  return answers;
}
