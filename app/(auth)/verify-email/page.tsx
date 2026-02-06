"use client";

import { useVerifyEmail } from "@/services/api";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const verifyEmailMutation = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              {verifyEmailMutation.isPending && (
                <div className="rounded-full bg-primary/10 p-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}
              {verifyEmailMutation.isSuccess && (
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
                </div>
              )}
              {verifyEmailMutation.isError && (
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                </div>
              )}
            </div>
            <CardTitle className="text-center">
              {verifyEmailMutation.isPending && "Verifying Email..."}
              {verifyEmailMutation.isSuccess && "Email Verified!"}
              {verifyEmailMutation.isError && "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-center">
              {verifyEmailMutation.isPending &&
                "Please wait while we verify your email address"}
              {verifyEmailMutation.isSuccess &&
                "Your email has been successfully verified. You can now login to your account."}
              {verifyEmailMutation.isError &&
                "The verification link is invalid or has expired. Please request a new verification email."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {verifyEmailMutation.isSuccess && (
                <Button asChild className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              )}
              {verifyEmailMutation.isError && (
                <>
                  <Button asChild className="w-full">
                    <Link href="/resend-verification">
                      Resend Verification Email
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
