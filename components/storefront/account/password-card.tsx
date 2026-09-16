"use client";
// coding-standard: maintained

import { useState, type CSSProperties } from "react";
import { toast } from "@/lib/storefront-toast";
import { useShopperAccount } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { SfPasswordInput } from "@/components/storefront/sf-password-input";
import { brandButton } from "@/lib/storefront-button";

const fieldLabel: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 7,
};

/**
 * Change-password card (Profile tab, below personal details). Requires the
 * current password; the emailed reset flow covers the forgotten-password case.
 */
export function PasswordCard() {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const { changePassword } = useShopperAccount(slug);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const save = () => {
    if (next.length < 6) {
      toast.error(t.passwordMin);
      return;
    }
    if (next !== confirm) {
      toast.error(t.passwordMismatch);
      return;
    }
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          toast.success(t.passwordUpdated);
          setCurrent("");
          setNext("");
          setConfirm("");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const canSave = current.length > 0 && next.length > 0 && confirm.length > 0;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, marginTop: 14 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.01em" }}>
        {t.changePasswordTitle}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={fieldLabel}>{t.currentPasswordLabel}</label>
          <SfPasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "var(--profcols)", gap: "14px 40px" }}>
          <div>
            <label style={fieldLabel}>{t.newPasswordLabel}</label>
            <SfPasswordInput autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <label style={fieldLabel}>{t.confirmPasswordLabel}</label>
            <SfPasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={save}
            disabled={!canSave || changePassword.isPending}
            style={{ ...brandButton({ radius: 8, padding: "11px 22px", fontSize: 14 }), border: "none", fontFamily: "inherit", fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", opacity: !canSave || changePassword.isPending ? 0.6 : 1 }}
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
