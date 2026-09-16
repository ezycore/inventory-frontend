"use client";
// coding-standard: maintained

import { useEffect, type CSSProperties } from "react";
import { toast } from "@/lib/storefront-toast";
import { storefrontApi } from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useResendVerification } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { brandButton, buttonMetrics } from "@/lib/storefront-button";

/**
 * Blocking card shown where an action needs a confirmed email (checkout).
 * Offers resend + an "I've verified" recheck; also refreshes the persisted
 * profile once on mount, since the shopper may have clicked the email link in
 * another tab (or the stored profile predates the emailVerified field). The
 * parent re-renders past the gate as soon as the store says verified.
 */
export function VerifyEmailGate() {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const shopper = useShopperStore((s) => s.shopper);
  const token = useShopperStore((s) => s.token);
  const setShopper = useShopperStore((s) => s.setShopper);
  const resend = useResendVerification(slug);

  const refresh = () =>
    token
      ? storefrontApi.me(slug, token).then((next) => {
          setShopper(next);
          return next;
        })
      : Promise.reject(new Error(t.oauthFailed));

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  const doResend = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.success(t.verificationSent),
      onError: (e) => toast.error((e as Error).message),
    });

  const doRecheck = () =>
    refresh()
      .then((next) => {
        if (!next.emailVerified) toast.error(t.stillUnverified);
      })
      .catch((e) => toast.error((e as Error).message));

  return (
    <div style={card}>
      <div style={badge}>
        <Icon name="mail" size={26} />
      </div>
      <h1 style={title}>{t.verifyToOrderTitle}</h1>
      <p style={lead}>
        {t.verifySentTo}{" "}
        <strong style={{ color: "var(--text)" }}>{shopper?.email}</strong>.
      </p>
      <p style={hint}>{t.verifySpamHint}</p>
      <div style={actions}>
        <button
          type="button"
          onClick={doResend}
          disabled={resend.isPending}
          style={{ ...primaryBtn, opacity: resend.isPending ? 0.6 : 1 }}
        >
          {t.resendVerification}
        </button>
        <button type="button" onClick={doRecheck} style={secondaryBtn}>
          {t.iveVerified}
        </button>
      </div>
    </div>
  );
}

const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "32px 28px",
  textAlign: "center",
  maxWidth: 480,
  margin: "0 auto",
};
const badge: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "var(--primary-soft)",
  color: "var(--primary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 14,
};
const title: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: "0 0 8px",
};
const lead: CSSProperties = {
  fontSize: 14.5,
  color: "var(--muted)",
  lineHeight: 1.55,
  margin: "0 0 6px",
};
const hint: CSSProperties = {
  fontSize: 12.5,
  color: "var(--faint, var(--muted))",
  lineHeight: 1.55,
  margin: "0 0 4px",
};
const actions: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 10,
  marginTop: 20,
};
const primaryBtn: CSSProperties = {
  ...brandButton({ radius: 9, padding: "10px 18px", fontSize: 13.5 }),
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};
const secondaryBtn: CSSProperties = {
  ...buttonMetrics({ radius: 9, padding: "10px 18px", fontSize: 13.5 }),
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  color: "var(--text)",
  fontWeight: 600,
  border: "1px solid var(--border-strong, var(--border))",
  cursor: "pointer",
  fontFamily: "inherit",
};
