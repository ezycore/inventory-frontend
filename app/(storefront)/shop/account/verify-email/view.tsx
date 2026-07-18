"use client";
// coding-standard: maintained

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import {
  useResendVerification,
  useVerifyEmail,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { storefrontApi } from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { Icon, type IconName } from "@/components/storefront/sf-icons";

/**
 * Email verification screen — two modes on one route:
 *  - No `?token=` (where manual signup lands): a "check your inbox" interstitial
 *    naming the address and offering a resend, so a new shopper knows to confirm
 *    before the account is fully active.
 *  - With `?token=` (the emailed link): auto-verify, then success/error state.
 * Signed-in shoppers get their persisted profile refreshed on success so the
 * account "verify your email" banner clears immediately.
 */
export default function VerifyEmailPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const token = useSearchParams().get("token") ?? "";
  const verify = useVerifyEmail(slug);
  const { mutate } = verify;
  const fired = useRef(false);

  const sessionSlug = useShopperStore((s) => s.slug);
  const sessionToken = useShopperStore((s) => s.token);
  const shopper = useShopperStore((s) => s.shopper);
  const setShopper = useShopperStore((s) => s.setShopper);
  const signedIn = !!sessionToken && sessionSlug === slug;

  // Auto-verify once when the page opens from the email link.
  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    mutate(token);
  }, [token, mutate]);

  // Refresh the persisted profile so the account banner disappears immediately.
  useEffect(() => {
    if (!verify.isSuccess || !signedIn) return;
    storefrontApi.me(slug, sessionToken!).then(setShopper).catch(() => {});
  }, [verify.isSuccess, signedIn, slug, sessionToken, setShopper]);

  const resend = useResendVerification(slug);
  const doResend = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.success(t.verificationSent),
      onError: (e) => toast.error((e as Error).message),
    });

  return (
    <div style={wrap}>
      <div style={card}>
        {token ? (
          <VerifyResult
            state={
              verify.isSuccess
                ? "success"
                : verify.isError
                  ? "error"
                  : "pending"
            }
            errorMessage={(verify.error as Error)?.message}
            base={base}
            t={t}
          />
        ) : (
          <InboxNotice
            email={shopper?.email}
            signedIn={signedIn}
            resending={resend.isPending}
            onResend={doResend}
            base={base}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

type Dict = ReturnType<typeof useStorefrontUI>["t"];

/** Post-signup "check your inbox" state. */
function InboxNotice({
  email,
  signedIn,
  resending,
  onResend,
  base,
  t,
}: {
  email?: string;
  signedIn: boolean;
  resending: boolean;
  onResend: () => void;
  base: string;
  t: Dict;
}) {
  return (
    <>
      <Badge tone="brand" icon="mail" />
      <h1 style={title}>{t.verifyNudgeTitle}</h1>
      <p style={lead}>
        {t.verifySentTo}
        {email ? (
          <>
            {" "}
            <strong style={{ color: "var(--text)" }}>{email}</strong>
          </>
        ) : null}
        .
      </p>
      <p style={hint}>{t.verifySpamHint}</p>
      <div style={actions}>
        {signedIn ? (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            style={{ ...primaryBtn, opacity: resending ? 0.6 : 1 }}
          >
            {t.resendVerification}
          </button>
        ) : null}
        <Link href={storeHref(base, "/account")} style={secondaryBtn}>
          {t.goToAccount}
        </Link>
      </div>
    </>
  );
}

/** Emailed-link auto-verify state. */
function VerifyResult({
  state,
  errorMessage,
  base,
  t,
}: {
  state: "pending" | "success" | "error";
  errorMessage?: string;
  base: string;
  t: Dict;
}) {
  const map = {
    pending: { tone: "muted" as const, icon: "mail" as const, msg: t.verifying },
    success: { tone: "success" as const, icon: "check" as const, msg: t.verifiedThanks },
    error: {
      tone: "error" as const,
      icon: "close" as const,
      msg: errorMessage || t.verifyMissingToken,
    },
  }[state];

  return (
    <>
      <Badge tone={map.tone} icon={map.icon} />
      <h1 style={title}>{t.verifyNudgeTitle}</h1>
      <p style={lead}>{map.msg}</p>
      <div style={actions}>
        <Link href={storeHref(base, "/account")} style={secondaryBtn}>
          {t.goToAccount}
        </Link>
      </div>
    </>
  );
}

// Success/error mix toward the theme text so they stay visible in dark mode.
const TONES = {
  brand: { bg: "var(--primary-soft)", fg: "var(--primary)" },
  muted: { bg: "var(--card-alt, var(--border))", fg: "var(--muted)" },
  success: {
    bg: "color-mix(in srgb, #16a34a 14%, transparent)",
    fg: "color-mix(in srgb, #16a34a 75%, var(--text))",
  },
  error: {
    bg: "color-mix(in srgb, #dc2626 14%, transparent)",
    fg: "color-mix(in srgb, #dc2626 75%, var(--text))",
  },
};

function Badge({ tone, icon }: { tone: keyof typeof TONES; icon: IconName }) {
  const c = TONES[tone];
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: c.bg,
        color: c.fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
      }}
    >
      <Icon name={icon} size={26} />
    </div>
  );
}

const wrap: CSSProperties = {
  maxWidth: 480,
  margin: "0 auto",
  width: "100%",
  padding: "40px var(--pad) 64px",
};
const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "32px 28px",
  textAlign: "center",
};
const title: CSSProperties = {
  fontSize: 21,
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--primary)",
  color: "var(--on-primary)",
  fontSize: 13.5,
  fontWeight: 700,
  padding: "10px 18px",
  borderRadius: 9,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};
const secondaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  color: "var(--text)",
  fontSize: 13.5,
  fontWeight: 600,
  padding: "10px 18px",
  borderRadius: 9,
  border: "1px solid var(--border-strong, var(--border))",
  cursor: "pointer",
  fontFamily: "inherit",
};
