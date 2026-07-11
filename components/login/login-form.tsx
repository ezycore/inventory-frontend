"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useLogin } from "@/services/api";
import {
  getRootDomain,
  isWorkspaceHost,
  shouldShowOrganizationSlugField,
  signupUrl,
  withOrganizationSlug,
} from "@/lib/organization-utils";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib/utils";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoginNotices } from "./login-notices";
import { WorkspaceChooser } from "./workspace-chooser";
import { useHydrated } from "@/hooks";


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth.login");
  // The apex workspace chooser forwards the email the user already typed as an
  // `?email=` param; seed the form with it so they don't retype it here, and
  // send focus straight to the password field.
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const [formData, setFormData] = useState({
    organizationSlug: "",
    email: prefilledEmail,
    password: "",
  });
  const [show2FA, setShow2FA] = useState(false);
  const loginMutation = useLogin(setShow2FA);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Host-dependent routing reads window.location, so it can only be resolved in the
  // browser. Gate on the client flag to keep SSR/hydration identical (no flash).
  const isClient = useHydrated();
  const showSlugField = shouldShowOrganizationSlugField();

  if (!isClient) {
    return (
      <div className={cn("flex min-h-40 items-center justify-center", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // On the platform apex (app.ezycore.com) with a root domain set — no implicit
  // workspace — sessions are per-origin, so route the user to their workspace
  // login. Custom domains and *.ezycore.com subdomains already imply a workspace
  // and fall through to the normal login. See docs/CUSTOM-DOMAINS-P1.md.
  if (getRootDomain() && !isWorkspaceHost()) {
    return <WorkspaceChooser className={className} {...props} />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataWithSlug = withOrganizationSlug(
      formData,
      formData.organizationSlug,
    );
    loginMutation.mutate(dataWithSlug);
  };

  const handle2FASubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataWithSlug = withOrganizationSlug(
      { ...formData, twoFactorToken },
      formData.organizationSlug,
    );
    loginMutation.mutate(dataWithSlug);
  };

  const handleBackToLogin = () => {
    setShow2FA(false);
    setTwoFactorToken("");
    setUseBackupCode(false);
    loginMutation.reset();
  };

  // If 2FA is required, show 2FA form
  if (show2FA) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>{t("twoFactor.title")}</CardTitle>
            </div>
            <CardDescription>
              {useBackupCode
                ? t("twoFactor.backupDescription")
                : t("twoFactor.authenticatorDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle2FASubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="twoFactorToken">
                    {useBackupCode ? t("twoFactor.backupCodeLabel") : t("twoFactor.authCodeLabel")}
                  </Label>
                  <Input
                    id="twoFactorToken"
                    type="text"
                    placeholder={useBackupCode ? t("twoFactor.backupCodePlaceholder") : t("twoFactor.authCodePlaceholder")}
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value)}
                    maxLength={useBackupCode ? 14 : 6}
                    className="text-center text-2xl font-mono tracking-widest"
                    autoComplete="off"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {useBackupCode
                      ? t("twoFactor.backupCodeHint")
                      : t("twoFactor.authCodeHint")}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {loginMutation.isPending ? t("twoFactor.verifying") : t("twoFactor.verify")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                  >
                    {useBackupCode
                      ? t("twoFactor.useAuthenticator")
                      : t("twoFactor.useBackupCode")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("twoFactor.backToLogin")}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <LoginNotices />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {showSlugField && (
                <div className="grid gap-3">
                  <Label htmlFor="organizationSlug">{t("orgSlugLabel")}</Label>
                  <Input
                    id="organizationSlug"
                    type="text"
                    placeholder={t("orgSlugPlaceholder")}
                    value={formData.organizationSlug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizationSlug: e.target.value,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("orgSlugDescription")}
                  </p>
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("passwordLabel")}</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  autoFocus={Boolean(prefilledEmail)}
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {loginMutation.isPending ? t("submitting") : t("submit")}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              {t("noAccount")}{" "}
              <Link
                href={signupUrl()}
                className="underline underline-offset-4"
              >
                {t("signUp")}
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <Link
                href="/resend-verification"
                className="text-muted-foreground hover:underline underline-offset-4"
              >
                {t("resendVerification")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
