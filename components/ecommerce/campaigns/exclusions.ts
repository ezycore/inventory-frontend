// coding-standard: maintained
import type { Campaign } from "@/services/api";
import {
  CAMPAIGN_EXCLUDE_FIELD,
  scopeTakesExclusions,
  type CampaignExcludeKey,
} from "./form-config";

export type CampaignExclusionsBody = Record<CampaignExcludeKey, string[]>;

const keys = Object.keys(CAMPAIGN_EXCLUDE_FIELD) as CampaignExcludeKey[];

/**
 * Form values → the `exclude` block sent on save.
 *
 * Always sent WHOLE, every list present: the backend replaces the block on
 * update, so this is also how exclusions are cleared. The switch off, or a
 * `product` scope (which takes none), sends four empty lists — values left in
 * a hidden picker must never keep withholding a discount the merchant can no
 * longer see.
 */
export function campaignExclusionsBody(
  data: Record<string, unknown>,
): CampaignExclusionsBody {
  const on =
    data.excludeEnabled === true && scopeTakesExclusions(data.scope as string);
  return Object.fromEntries(
    keys.map((key) => {
      const picked = data[CAMPAIGN_EXCLUDE_FIELD[key]];
      const ids = on && Array.isArray(picked) ? picked.filter(Boolean) : [];
      return [key, ids.map(String)];
    }),
  ) as CampaignExclusionsBody;
}

/**
 * A campaign row → the exclusion form values. The switch opens ON exactly when
 * something is excluded, so editing never hides an exclusion behind it.
 */
export function campaignExclusionsForm(c: Pick<Campaign, "exclude">) {
  const values: Record<string, unknown> = {};
  let any = false;
  for (const key of keys) {
    const ids = (c.exclude?.[key] ?? []).map(String);
    values[CAMPAIGN_EXCLUDE_FIELD[key]] = ids;
    if (ids.length) any = true;
  }
  return { excludeEnabled: any, ...values };
}
