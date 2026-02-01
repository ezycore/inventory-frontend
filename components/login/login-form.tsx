"use client";
import { useLogin } from "@/services/api";
import {
  getOrganizationSlugDescription,
  getOrganizationSlugPlaceholder,
  shouldShowOrganizationSlugField,
  withOrganizationSlug,
} from "@/lib/organization-utils";
import { Alert, AlertDescription } from "@ui/components/alert";
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
import { ArrowLeft, Loader2, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [formData, setFormData] = useState({
    organizationSlug: "",
    email: "",
    password: "",
  });
  const [show2FA, setShow2FA] = useState(false);
  const loginMutation = useLogin(setShow2FA);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const showSlugField = shouldShowOrganizationSlugField();

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
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>
              {useBackupCode
                ? "Enter one of your backup codes"
                : "Enter the 6-digit code from your authenticator app"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle2FASubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="twoFactorToken">
                    {useBackupCode ? "Backup Code" : "Authentication Code"}
                  </Label>
                  <Input
                    id="twoFactorToken"
                    type="text"
                    placeholder={useBackupCode ? "XXXX-XXXX-XXXX" : "000000"}
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
                      ? "Each backup code can only be used once"
                      : "Open your authenticator app to get the code"}
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
                    {loginMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                  >
                    {useBackupCode
                      ? "Use authenticator code"
                      : "Use backup code instead"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
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
      {registered === "true" && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertDescription className="text-blue-800 dark:text-blue-400 ml-2">
            Account created successfully! Please check your email to verify your
            account before logging in.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {showSlugField && (
                <div className="grid gap-3">
                  <Label htmlFor="organizationSlug">Organization Slug</Label>
                  <Input
                    id="organizationSlug"
                    type="text"
                    placeholder={getOrganizationSlugPlaceholder()}
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
                    {getOrganizationSlugDescription()}
                  </p>
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
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
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
                {/* <Button variant="outline" className="w-full">
                  Login with Google
                </Button> */}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
            <div className="mt-2 text-center text-sm">
              <Link
                href="/resend-verification"
                className="text-muted-foreground hover:underline underline-offset-4"
              >
                Resend verification email
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
