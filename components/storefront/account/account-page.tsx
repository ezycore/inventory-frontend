"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import { useForgotPassword, useShopperAuth } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { useHydrated } from "@/hooks/use-hydrated";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Icon } from "@/components/storefront/sf-icons";
import { AccountArea } from "@/components/storefront/account/account-area";
import { SocialLoginButtons } from "@/components/storefront/account/social-login-buttons";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import { sfInput as input } from "@/components/storefront/field-styles";
import { SfPasswordInput } from "@/components/storefront/sf-password-input";
import { brandButton } from "@/lib/storefront-button";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};
const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 22,
};
const primaryBtn: CSSProperties = {
  ...brandButton({ radius: 8, padding: 12, fontSize: 14 }),
  width: "100%",
  border: "none",
  fontFamily: "inherit",
  fontWeight: 600,
  cursor: "pointer",
};

/**
 * `layout` is the `account-area` core section's own choice once this page is on
 * the builder — a RAW `templates.accountLayout` id, unset on every page the
 * migration builds, so a moved account area draws what the store already drew.
 */
export function AccountPageView({ layout }: { layout?: string } = {}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const shopper = useShopperStore((s) => s.shopper);
  const staffUser = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const { register, login } = useShopperAuth(slug);
  const forgot = useForgotPassword(slug);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [redirecting, setRedirecting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* ----------------------------- logged-in shopper ---------------------------- */
  // Until the persisted store hydrates we can't tell guest from member — render
  // a neutral splash, never the auth card (a signed-in shopper reloading the
  // page would see a "sign in" flash before their account appears).
  //
  // `redirecting` is armed synchronously at submit (before the request resolves),
  // so once auth succeeds `setAuth` flips `shopper` truthy with the flag already
  // set — the account view can never flash for the frame between login and the
  // navigation landing (e.g. account → verify-email after signup). Gating on
  // `shopper` too keeps the form visible while the request is still in flight.
  if (!hydrated || (redirecting && shopper)) {
    return (
      <div style={wrap}>
        <LoadingSplash />
      </div>
    );
  }
  if (shopper) {
    return <AccountArea shopper={shopper} layout={layout} />;
  }

  /* ------------------------------- auth (guest) ------------------------------- */
  const isLogin = mode === "login";
  const pending = register.isPending || login.isPending;
  const isStaffHere =
    hydrated && !!staffUser && staffUser.organization?.slug === slug;

  const doForgot = () => {
    if (!form.email) {
      toast.error(t.email);
      return;
    }
    forgot.mutate(form.email, {
      onSuccess: (r) => toast.success(r.message || t.resetLinkSent),
      onError: (e) => toast.error((e as Error).message),
    });
  };

  // A safe in-store redirect target from ?next= (checkout sends shoppers here as
  // /account?next=/checkout). Relative store paths only — never an open redirect.
  const readNext = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  };

  // After auth, bounce back to where the shopper came from, else the fallback.
  const afterAuth = (message: string, fallback?: string) => {
    toast.success(message);
    const target = readNext() ?? fallback;
    if (target) router.push(storeHref(base, target));
  };

  const submit = () => {
    if (isLogin) {
      // A login only navigates when a ?next= is waiting; arm the splash up front
      // only in that case so success can't flash the account view mid-redirect.
      if (readNext()) setRedirecting(true);
      login.mutate(
        { email: form.email, password: form.password },
        {
          onSuccess: () => afterAuth(t.welcomeBack),
          onError: (e) => {
            setRedirecting(false);
            toast.error((e as Error).message);
          },
        },
      );
    } else {
      // A new account always lands on the "confirm your email" screen (unless a
      // checkout ?next= is waiting). Arm the splash now — before setAuth flips
      // `shopper` truthy — so the account view can't flash before we navigate.
      setRedirecting(true);
      register.mutate(
        { name: form.name, email: form.email, phone: form.phone || undefined, password: form.password },
        {
          onSuccess: () => afterAuth(t.accountCreated, "/account/verify-email"),
          onError: (e) => {
            setRedirecting(false);
            toast.error((e as Error).message);
          },
        },
      );
    }
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        {isStaffHere ? (
          <>
            <div
              style={{
                ...card,
                marginBottom: 16,
                borderColor: "var(--primary)",
                background: "var(--primary-soft)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: "none", width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "var(--on-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="shield" size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {t.staffNotice}
                    {staffUser?.organization?.name ? (
                      <span style={{ fontWeight: 400, color: "var(--muted)" }}> · {staffUser.organization.name}</span>
                    ) : null}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 12px" }}>
                    {t.staffNoticeMsg}
                  </p>
                  <Link
                    href="/ecommerce/dashboard"
                    style={{ ...brandButton({ radius: 8, padding: "9px 14px", fontSize: 13 }), display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
                  >
                    {t.goToAdmin}
                  </Link>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", textAlign: "center", margin: "0 0 12px" }}>
              {t.shopAsCustomer}
            </div>
          </>
        ) : null}

        <div style={card}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="user" size={24} />
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
              {isLogin ? t.signInTitle : t.createTitle}
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
              {isLogin ? t.signInSubtitle : t.createSubtitle}
            </p>
          </div>

          {/* Social sign-in leads: it is one tap, and an OAuth shopper arrives
              already email-verified, so it clears BOTH gates this store puts in
              front of checkout. Renders nothing (divider included) when the
              merchant has no provider configured. */}
          <SocialLoginButtons />

          {/* method="post": the sign-in / register form is server HTML until
              React hydrates, and Enter submits it natively before then. With no
              method that is a GET, which would put the shopper's email and
              password in the query string. */}
          <form
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pending) submit();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {!isLogin ? (
              <Field label={t.fullName}>
                <input style={input} placeholder={t.fullName} value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
            ) : null}
            <Field label={t.email}>
              <input style={input} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </Field>
            {!isLogin ? (
              <Field label={t.phone}>
                <input style={input} type="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
            ) : null}
            <Field
              label={t.password}
              action={
                isLogin ? (
                  <button type="button" onClick={doForgot} disabled={forgot.isPending} style={{ background: "none", border: "none", padding: 0, fontSize: 12, color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}>
                    {t.forgotPassword}
                  </button>
                ) : undefined
              }
            >
              <SfPasswordInput autoComplete={isLogin ? "current-password" : "new-password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </Field>
            <button type="submit" disabled={pending} style={{ ...primaryBtn, opacity: pending ? 0.6 : 1, marginTop: 4 }}>
              {pending
                ? isLogin
                  ? t.signingIn
                  : t.creatingAccount
                : isLogin
                  ? t.signIn
                  : t.createAccount}
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--border)", margin: "18px 0 14px" }} />
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
            {isLogin ? t.noAccountPrompt : t.haveAccountPrompt}{" "}
            <button
              type="button"
              onClick={() => setMode(isLogin ? "register" : "login")}
              style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}
            >
              {isLogin ? t.createAccount : t.signIn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}
