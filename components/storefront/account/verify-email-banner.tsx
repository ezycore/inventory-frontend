"use client";
// coding-standard: maintained

import { toast } from "sonner";
import { useResendVerification } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * Unverified-email nudge at the top of the account area. Verification is soft
 * (shoppers can browse and buy without it), so this stays a banner — never a
 * blocker. Amber literals read correctly on both themes.
 */
export function VerifyEmailBanner() {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const resend = useResendVerification(slug);

  const doResend = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.success(t.verificationSent),
      onError: (e) => toast.error((e as Error).message),
    });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
      }}
    >
      <span style={{ display: "flex", flex: "none", color: "#f59e0b" }}>
        <Icon name="mail" size={19} />
      </span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.verifyNudgeTitle}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 1 }}>
          {t.verifyNudgeMsg}
        </div>
      </div>
      <button
        type="button"
        onClick={doResend}
        disabled={resend.isPending}
        style={{
          flex: "none",
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--text)",
          background: "transparent",
          border: "1px solid rgba(245, 158, 11, 0.55)",
          borderRadius: 8,
          padding: "7px 14px",
          cursor: "pointer",
          fontFamily: "inherit",
          opacity: resend.isPending ? 0.6 : 1,
        }}
      >
        {t.resendVerification}
      </button>
    </div>
  );
}
