"use client";

import {
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useForgotPassword, useShopperAuth } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Icon } from "@/components/storefront/sf-icons";

// Returns false on the server / first client render, then true — a
// hydration-safe "is client" signal so we can read the staff session without an
// SSR mismatch (the storefront SSR is anonymous/cacheable).
const subscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

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
const input: CSSProperties = {
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: 8,
  padding: "11px 13px",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  width: "100%",
};
const primaryBtn: CSSProperties = {
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
};

export default function AccountPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const shopper = useShopperStore((s) => s.shopper);
  const logout = useShopperStore((s) => s.logout);
  const staffUser = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const { register, login } = useShopperAuth(slug);
  const forgot = useForgotPassword(slug);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* ----------------------------- logged-in shopper ---------------------------- */
  if (shopper) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>{t.myAccount}</h1>
        <div style={{ display: "flex", gap: 26, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          <span style={{ borderBottom: "2px solid var(--primary)", paddingBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>
            {t.tabProfile}
          </span>
          <Link href={storeHref(base, "/account/orders")} style={{ paddingBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>
            {t.tabOrders}
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary)", color: "var(--on-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
                {shopper.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{shopper.name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{shopper.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
              {t.personalInfo}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InfoRow label={t.name} value={shopper.name} />
              {shopper.phone ? <InfoRow label={t.phone} value={shopper.phone} mono /> : null}
              <InfoRow label={t.email} value={shopper.email} last />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
            <Link href={storeHref(base, "/account/orders")} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t.orderHistory}</span>
              <Icon name="chevR" size={16} />
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success(t.logout);
              }}
              style={{ ...card, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>
    );
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
      onSuccess: (r) => toast.success(r.message || "Sent"),
      onError: (e) => toast.error((e as Error).message),
    });
  };

  const submit = () => {
    if (isLogin) {
      login.mutate(
        { email: form.email, password: form.password },
        { onSuccess: () => toast.success(t.welcomeBack), onError: (e) => toast.error((e as Error).message) },
      );
    } else {
      register.mutate(
        { name: form.name, email: form.email, phone: form.phone || undefined, password: form.password },
        { onSuccess: () => toast.success(t.accountCreated), onError: (e) => toast.error((e as Error).message) },
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
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "var(--on-primary)", fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 8 }}
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

          <form
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
              <input style={input} type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} required />
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

function InfoRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: last ? 0 : 11, borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span className={mono ? "sf-mono" : undefined} style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
