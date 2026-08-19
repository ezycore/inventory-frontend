"use client";
// coding-standard: maintained

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import { useResetPassword } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import { SfPasswordInput } from "@/components/storefront/sf-password-input";

const wrap: CSSProperties = {
  maxWidth: 440,
  margin: "0 auto",
  width: "100%",
  padding: "40px var(--pad) 64px",
};
const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "32px 28px",
};
const fieldLabel: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--text)",
};

/** Password-reset landing for the emailed link (`?token=`), on the sf design system. */
export default function ResetPasswordPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const reset = useResetPassword(slug);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = () => {
    if (password.length < 6) {
      toast.error(t.passwordMin);
      return;
    }
    if (password !== confirm) {
      toast.error(t.passwordMismatch);
      return;
    }
    reset.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success(t.passwordUpdated);
          router.push(storeHref(base, "/account"));
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  if (!token) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px" }}>
            {t.resetLinkInvalid}
          </p>
          <Link
            href={storeHref(base, "/account")}
            style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}
          >
            ← {t.signIn}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--primary-soft)",
              color: "var(--primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Icon name="lock" size={22} />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {t.resetPwTitle}
          </h1>
        </div>

        {/* method="post" matters most here: this page is already at ?token=…,
            so a native pre-hydration submit would GET the form and put the reset
            token AND the shopper's new password in one URL — history, Referer,
            and every proxy log between them and us. */}
        <form
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reset.isPending) submit();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabel}>{t.newPasswordLabel}</span>
            <SfPasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabel}>{t.confirmPasswordLabel}</span>
            <SfPasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={reset.isPending}
            style={{
              width: "100%",
              background: "var(--primary)",
              color: "var(--on-primary)",
              border: "none",
              padding: 12,
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 4,
              opacity: reset.isPending ? 0.6 : 1,
            }}
          >
            {t.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
}
