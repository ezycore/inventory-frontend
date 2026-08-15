import type { OrganizationFeatures } from "@/types";
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
