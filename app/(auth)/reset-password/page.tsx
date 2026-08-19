"use client";

import { useResetPassword } from "@/services/api";
import { workspaceUrl } from "@/lib/organization-utils";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Password } from "@ui/components/input-password";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib/utils";
import { KeyRound, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // Reset emails carry the workspace slug as `org` (email.service.ts). After a
  // successful reset we hand the user to their workspace login. In production
  // that's their subdomain (e.g. acme.ezycore.com) — a different origin — so we
  // navigate with a full page load. Locally/staging there's no root domain, so
  // workspaceUrl returns a relative "/login" and we keep the SPA router.
  const org = searchParams.get("org");
  const resetPasswordMutation = useResetPassword();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const passwordsMismatch =
    Boolean(formData.newPassword) &&
    Boolean(formData.confirmPassword) &&
    formData.newPassword !== formData.confirmPassword;

  if (!token) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div
                  className="rounded-full bg-destructive/10 p-3"
                  aria-hidden="true"
                >
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-center">Invalid reset link</CardTitle>
              <CardDescription className="text-center">
                This password reset link is missing a token or is malformed.
                Please request a new link.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link
                href="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Request new link
              </Link>
              <Link
                href="/login"
                className="text-center text-sm underline underline-offset-4"
              >
                Back to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordsMismatch) {
      return; // Toast will be shown from validation
    }

    resetPasswordMutation.mutate(
      {
        token,
        newPassword: formData.newPassword,
      },
      {
        onSuccess: () => {
          const loginHref = org
            ? workspaceUrl(org, "/login?reset=success")
            : "/login?reset=success";
          // Relative target (local/staging) → SPA push; absolute workspace
          // subdomain URL (production) → full-page load to cross the origin.
          if (loginHref.startsWith("/")) {
            router.push(loginHref);
          } else {
            window.location.assign(loginHref);
          }
        },
      },
    );
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* method="post" matters most here: this page is already at
                  ?token=…, so a pre-hydration Enter would GET the form and
                  land the reset token AND the new password in one URL —
                  browser history, Referer, and every proxy log on the way. */}
              <form method="post" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Password
                      id="newPassword"
                      placeholder="Min. 8 characters"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Password
                      id="confirmPassword"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      minLength={8}
                      aria-invalid={passwordsMismatch}
                      aria-describedby={
                        passwordsMismatch ? "password-mismatch-error" : undefined
                      }
                    />
                  </div>
                  {passwordsMismatch && (
                    <p
                      id="password-mismatch-error"
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      Passwords do not match
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      resetPasswordMutation.isPending || passwordsMismatch
                    }
                  >
                    {resetPasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {resetPasswordMutation.isPending
                      ? "Resetting..."
                      : "Reset Password"}
                  </Button>
                  <div className="text-center text-sm">
                    <Link
                      href="/login"
                      className="underline underline-offset-4"
                    >
                      Back to login
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
