"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useForgotPassword, useShopperAuth } from "@/services/storefront/hooks";
import { useShopperStore } from "@/services/stores/use-shopper-store";

export default function AccountPage() {
  const slug = String(useParams().slug);
  const shopper = useShopperStore((s) => s.shopper);
  const logout = useShopperStore((s) => s.logout);
  const { register, login } = useShopperAuth(slug);
  const forgot = useForgotPassword(slug);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (shopper) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">My account</h1>
        <div className="space-y-1 rounded-lg border bg-white p-4 text-sm">
          <p>
            <span className="text-gray-500">Name:</span> {shopper.name}
          </p>
          <p>
            <span className="text-gray-500">Email:</span> {shopper.email}
            {!shopper.emailVerified && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                unverified
              </span>
            )}
          </p>
          {shopper.phone && (
            <p>
              <span className="text-gray-500">Phone:</span> {shopper.phone}
            </p>
          )}
        </div>
        <Link
          href={`/s/${slug}/account/orders`}
          className="inline-block rounded-md border px-4 py-2 text-sm"
        >
          View my orders
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            toast.success("Signed out");
          }}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </div>
    );
  }

  const isLogin = mode === "login";
  const pending = register.isPending || login.isPending;

  const doForgot = () => {
    if (!form.email) {
      toast.error("Enter your email above first");
      return;
    }
    forgot.mutate(form.email, {
      onSuccess: (r) =>
        toast.success(
          r.message || "If an account exists, a reset link has been sent.",
        ),
      onError: (e) => toast.error((e as Error).message),
    });
  };

  const submit = () => {
    if (isLogin) {
      login.mutate(
        { email: form.email, password: form.password },
        {
          onSuccess: () => toast.success("Welcome back!"),
          onError: (e) => toast.error((e as Error).message),
        },
      );
    } else {
      register.mutate(
        {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        },
        {
          onSuccess: () => toast.success("Account created!"),
          onError: (e) => toast.error((e as Error).message),
        },
      );
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md px-3 py-1 ${isLogin ? "bg-[var(--sf-brand,#111827)] text-white" : "border"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-md px-3 py-1 ${!isLogin ? "bg-[var(--sf-brand,#111827)] text-white" : "border"}`}
        >
          Create account
        </button>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-4">
        {!isLogin && (
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        )}
        <input
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        {!isLogin && (
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="Phone (optional)"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        )}
        <input
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="w-full rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>
        {isLogin && (
          <button
            type="button"
            onClick={doForgot}
            disabled={forgot.isPending}
            className="w-full text-center text-xs text-gray-500 hover:underline disabled:opacity-50"
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
