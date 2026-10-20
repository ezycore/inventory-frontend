// coding-standard: maintained
import type { SocialProofSettings } from "@/types/api";

/**
 * Adds the social proof block (docs/plan/social-proof.md) to the hand-written settings type.
 *
 * An augmentation rather than a field in `types/index.ts`, which has not been brought to the
 * coding standard yet; the shape itself is the generated backend contract, so it cannot drift.
 * Move it into the interface when that file is next rewritten.
 */
declare module "@/types" {
  interface StorefrontSettings {
    /** Sold chip + purchase toast behaviour. Absent = both off. */
    socialProof?: SocialProofSettings;
  }
}
