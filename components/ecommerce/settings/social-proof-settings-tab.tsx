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
  toSocialProofPayload,
  type PurchaseToastDraft,
  type SoldCountDraft,
} from "./social-proof-shared";
import { SoldCountSettingsCard } from "./sold-count-settings-card";

/**
 * Store settings → Social proof: the sold chip and the recent-purchase popup
 * (docs/plan/social-proof.md). Both start off. This tab is behaviour only — the look is a
 * Customize setting with a live preview, like every other piece of the shop's design.
 */
export function SocialProofSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [sold, setSold] = useState(() => soldCountDraft(settings.socialProof?.soldCount));
  const [popup, setPopup] = useState(() => purchaseToastDraft(settings.socialProof?.purchaseToast));

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
    save({ socialProof: toSocialProofPayload(sold, popup) });
  };

  return (
    <div className="space-y-5">
      <SoldCountSettingsCard
        value={sold}
        onChange={(patch: Partial<SoldCountDraft>) => setSold((s) => ({ ...s, ...patch }))}
      />
      <PurchaseToastSettingsCard
        value={popup}
        onChange={(patch: Partial<PurchaseToastDraft>) => setPopup((s) => ({ ...s, ...patch }))}
      />
      <SaveBar pending={pending} onSave={onSave} />
    </div>
  );
}
