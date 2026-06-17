"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useResetPassword } from "@/services/storefront/hooks";

export default function ResetPasswordPage() {
  const slug = String(useParams().slug);
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const reset = useResetPassword(slug);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    reset.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success("Password updated. Please sign in.");
          router.push(`/s/${slug}/account`);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-8 text-center">
        <p className="text-sm text-gray-600">Missing reset token.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-8">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <div className="space-y-3 rounded-lg border bg-white p-4">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="New password"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          placeholder="Confirm new password"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={reset.isPending}
          onClick={submit}
          className="w-full rounded-md bg-[var(--sf-brand,#111827)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {reset.isPending ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}
