// coding-standard: maintained
import type { SocialProofSettings } from "@/types/api";

/**
 * Admin-side shapes and defaults for Store settings → Social proof (docs/plan/social-proof.md).
 * The defaults mirror the backend's `utils/social-proof.ts` — that file decides what an unset
 * field means on the shop; these only prefill the form so the merchant sees the same values.
 */
export type SoldCountDraft = NonNullable<SocialProofSettings["soldCount"]>;
export type PurchaseToastDraft = NonNullable<SocialProofSettings["purchaseToast"]>;
export type ToastEntry = NonNullable<PurchaseToastDraft["entries"]>[number];

export const SOLD_LABEL_DEFAULT = { en: "{count} sold", bn: "{count}টি বিক্রি হয়েছে" };
export const TOAST_TEMPLATE_DEFAULT = {
  en: "{name} from {area} bought {product}",
  bn: "{area} থেকে {name} কিনেছেন {product}",
};
export const MAX_TOAST_ENTRIES = 50;

export const soldCountDraft = (saved: SoldCountDraft | undefined): SoldCountDraft => ({
  enabled: saved?.enabled === true,
  countFrom: saved?.countFrom ?? "placed",
  minToShow: saved?.minToShow ?? 10,
  display: saved?.display ?? "exact",
  label: { en: saved?.label?.en ?? "", bn: saved?.label?.bn ?? "" },
  showOnCards: saved?.showOnCards === true,
});

export const purchaseToastDraft = (saved: PurchaseToastDraft | undefined): PurchaseToastDraft => ({
  enabled: saved?.enabled === true,
  source: saved?.source ?? "real",
  gapSeconds: saved?.gapSeconds ?? 30,
  staySeconds: saved?.staySeconds ?? 6,
  firstDelaySeconds: saved?.firstDelaySeconds ?? 8,
  maxPerVisit: saved?.maxPerVisit ?? 5,
  realWindowDays: saved?.realWindowDays ?? 7,
  fields: {
    name: saved?.fields?.name ?? "first",
    area: saved?.fields?.area ?? "district",
    product: saved?.fields?.product !== false,
    image: saved?.fields?.image !== false,
    time: saved?.fields?.time !== false,
  },
  template: { en: saved?.template?.en ?? "", bn: saved?.template?.bn ?? "" },
  position: saved?.position ?? "bottom-left",
  entries: saved?.entries ?? [],
});

/** Blank text fields are left out, so the backend's built-in wording applies. */
const text = (value: { en?: string; bn?: string } | undefined) => {
  const en = value?.en?.trim();
  const bn = value?.bn?.trim();
  return en || bn ? { ...(en ? { en } : {}), ...(bn ? { bn } : {}) } : undefined;
};

/** The block the PATCH carries — both halves, always: the backend replaces it wholesale. */
export const toSocialProofPayload = (
  sold: SoldCountDraft,
  toast: PurchaseToastDraft,
): SocialProofSettings => ({
  soldCount: { ...sold, label: text(sold.label) },
  purchaseToast: {
    ...toast,
    template: text(toast.template),
    entries: (toast.entries ?? []).map((entry) => ({
      productId: entry.productId,
      ...(entry.name?.trim() ? { name: entry.name.trim() } : {}),
      ...(entry.area?.trim() ? { area: entry.area.trim() } : {}),
      ...(entry.timeLabel?.trim() ? { timeLabel: entry.timeLabel.trim() } : {}),
    })),
  },
});
