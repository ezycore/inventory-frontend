"use client";
// coding-standard: maintained

import { useState } from "react";
import { toast } from "sonner";
import type { StorefrontSettings } from "@/types";
import { PurchaseToastSettingsCard } from "./purchase-toast-settings-card";
import { SaveBar, useStoreSettingsSave } from "./settings-form-shared";
import {
  purchaseToastDraft,
  soldCountDraft,
  stockLabelMissingCount,
  stockLeftDraft,
  toSocialProofPayload,
  type PurchaseToastDraft,
  type SoldCountDraft,
  type StockLeftDraft,
} from "./social-proof-shared";
import { SoldCountSettingsCard } from "./sold-count-settings-card";
import { StockLeftSettingsCard } from "./stock-left-settings-card";

/**
 * Store settings → Social proof: the sold chip, the "Only 3 left" chip and the recent-purchase
 * popup (docs/plan/social-proof.md, docs/plan/related-products-and-stock-left.md). All start off. This tab is behaviour only — the look is a
 * Customize setting with a live preview, like every other piece of the shop's design.
 */
export function SocialProofSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [sold, setSold] = useState(() => soldCountDraft(settings.socialProof?.soldCount));
  const [popup, setPopup] = useState(() => purchaseToastDraft(settings.socialProof?.purchaseToast));
  const [stock, setStock] = useState(() => stockLeftDraft(settings.socialProof?.stockLeft));

  const onSave = () => {
    // An entry with no product can never be shown, and the backend refuses it — say which.
    const usesEntries = popup.enabled && popup.source !== "real";
    if (usesEntries && (popup.entries ?? []).some((entry) => !entry.productId)) {
      toast.error("Choose a product for every entry, or remove it");
      return;
    }
    if (popup.enabled && popup.source === "custom" && !(popup.entries ?? []).length) {
      toast.error("Add at least one entry, or show real orders");
      return;
    }
    if (stockLabelMissingCount(stock)) {
      toast.error("Add {count} to the “Only … left” text, where the number goes");
      return;
    }
    save({ socialProof: toSocialProofPayload(sold, popup, stock) });
  };

  return (
    <div className="space-y-5">
      <SoldCountSettingsCard
        value={sold}
        onChange={(patch: Partial<SoldCountDraft>) => setSold((s) => ({ ...s, ...patch }))}
      />
      <StockLeftSettingsCard
        value={stock}
        onChange={(patch: Partial<StockLeftDraft>) => setStock((s) => ({ ...s, ...patch }))}
      />
      <PurchaseToastSettingsCard
        value={popup}
        onChange={(patch: Partial<PurchaseToastDraft>) => setPopup((s) => ({ ...s, ...patch }))}
      />
      <SaveBar pending={pending} onSave={onSave} />
    </div>
  );
}
