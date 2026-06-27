"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useForgotPassword, useShopperAuth } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { Icon } from "@/components/storefront/sf-icons";

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
  padding: "12px 14px",
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
  const { register, login } = useShopperAuth(slug);
  const forgot = useForgotPassword(slug);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

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

  const isLogin = mode === "login";
  const pending = register.isPending || login.isPending;

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
        { onSuccess: () => toast.success("Welcome back!"), onError: (e) => toast.error((e as Error).message) },
      );
    } else {
      register.mutate(
        { name: form.name, email: form.email, phone: form.phone || undefined, password: form.password },
        { onSuccess: () => toast.success("Account created!"), onError: (e) => toast.error((e as Error).message) },
      );
    }
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, fontSize: 14, marginBottom: 16 }}>
          <button type="button" onClick={() => setMode("login")} style={tabBtn(isLogin)}>
            {t.account}
          </button>
          <button type="button" onClick={() => setMode("register")} style={tabBtn(!isLogin)}>
            {t.editProfile === "Edit" ? "Create account" : "অ্যাকাউন্ট তৈরি"}
          </button>
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
          {!isLogin ? <input style={input} placeholder={t.fullName} value={form.name} onChange={(e) => set("name", e.target.value)} /> : null}
          <input style={input} type="email" placeholder={t.email} value={form.email} onChange={(e) => set("email", e.target.value)} />
          {!isLogin ? <input style={input} placeholder={t.phone} value={form.phone} onChange={(e) => set("phone", e.target.value)} /> : null}
          <input style={input} type="password" placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} />
          <button type="button" disabled={pending} onClick={submit} style={{ ...primaryBtn, opacity: pending ? 0.6 : 1 }}>
            {pending ? "…" : t.account}
          </button>
          {isLogin ? (
            <button type="button" onClick={doForgot} disabled={forgot.isPending} style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
              Forgot password?
            </button>
          ) : null}
        </div>
      </div>
    </div>
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

function tabBtn(active: boolean): CSSProperties {
  return {
    background: active ? "var(--primary)" : "transparent",
    color: active ? "var(--on-primary)" : "var(--text)",
    border: active ? "none" : "1px solid var(--border-strong)",
    borderRadius: 8,
    padding: "8px 14px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}
