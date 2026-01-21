"use client";

import { useResetPassword } from "@/hooks/queries/use-auth";
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
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetPasswordMutation = useResetPassword();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return; // Toast will be shown from validation
    }

    if (!token) {
      return; // Token is required
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword,
    });
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
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
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
                    <Input
                      id="confirmPassword"
                      type="password"
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
                    />
                  </div>
                  {formData.newPassword &&
                    formData.confirmPassword &&
                    formData.newPassword !== formData.confirmPassword && (
                      <p className="text-sm text-red-600 dark:text-red-500">
                        Passwords do not match
                      </p>
                    )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      resetPasswordMutation.isPending ||
                      formData.newPassword !== formData.confirmPassword
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
