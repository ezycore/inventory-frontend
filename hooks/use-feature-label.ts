// coding-standard: maintained
import { useTranslations } from "next-intl";

/**
 * Human label for an organization feature flag key.
 *
 * `settings.features.names` is the single source — it carries all twelve flags
 * with labels a merchant recognises ("VAT", not `tax`; "SMS Notifications", not
 * `smsNotifications`). The billing screens each had their own partial copy:
 * `settings.billing.features` listed only seven, so the other five rendered as
 * **raw camelCase keys** beside properly labelled ones, and the plan cards
 * derived labels with `capitalize` over a camelCase split, which produced
 * "Uom Conversion" and "Sms Notifications" (QA-049).
 *
 * The fallback only runs for a flag that exists in the backend but has no label
 * yet — a new key ships readable instead of raw, and acronyms stay upright.
 */
const ACRONYMS = new Set(["uom", "sms", "vat", "id", "url"]);

export function useFeatureLabel(): (key: string) => string {
  const t = useTranslations("settings.features.names");

  return (key: string) => {
    if (t.has(key as never)) return t(key as never);
    return key
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(/\s+/)
      .map((w) =>
        ACRONYMS.has(w.toLowerCase())
          ? w.toUpperCase()
          : w.charAt(0).toUpperCase() + w.slice(1),
      )
      .join(" ");
  };
}
