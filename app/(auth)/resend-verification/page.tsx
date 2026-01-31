"use client";

import { useResendVerification } from "@/services/api/queries/use-auth";
import {
  getOrganizationSlugDescription,
  getOrganizationSlugPlaceholder,
  shouldShowOrganizationSlugField,
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
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ResendVerificationPage() {
  const resendVerificationMutation = useResendVerification();
  const [formData, setFormData] = useState({
    email: "",
    organizationSlug: "",
  });

  const showSlugField = shouldShowOrganizationSlugField();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataWithSlug = withOrganizationSlug(
      formData,
      formData.organizationSlug,
    );
    resendVerificationMutation.mutate(dataWithSlug);
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <MailCheck className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">
                Resend Verification Email
              </CardTitle>
              <CardDescription className="text-center">
                Enter your email address and we&apos;ll send you a new
                verification link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  {showSlugField && (
                    <div className="grid gap-3">
                      <Label htmlFor="organizationSlug">
                        Organization Slug
                      </Label>
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resendVerificationMutation.isPending}
                  >
                    {resendVerificationMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {resendVerificationMutation.isPending
                      ? "Sending..."
                      : "Resend Verification Email"}
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
