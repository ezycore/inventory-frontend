"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useUpdatePassword } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Password } from "@/ui/components/input-password";
import { Label } from "@/ui/components/label";
import { cn } from "@/ui/lib/utils";
import { Check, KeyRound, Loader2, Lock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PasswordChangeTab() {
  const t = useTranslations("settings.profile.password");
  const updatePassword = useUpdatePassword();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword === formData.currentPassword) {
      return toast.error(t("sameAsCurrentError"));
    }

    updatePassword.mutate(
      {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      },
      {
        onSuccess: () => {
          setFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          // No sign-out here. The backend retires every session on a password
          // change and returns a replacement token, which `useUpdatePassword`
          // swaps into the store — so other devices are signed out and this one
          // carries on. Tell the user that happened; it is the reason they might
          // have to log in again on their phone.
          toast.info(t("otherDevicesSignedOutNotice"));
        },
      },
    );
  };

  // Password requirements
  const requirements = [
    { label: t("requirements.minLength"), met: formData.newPassword.length >= 6 },
    { label: t("requirements.number"), met: /\d/.test(formData.newPassword) },
    {
      label: t("requirements.uppercase"),
      met: /[A-Z]/.test(formData.newPassword),
    },
    {
      label: t("requirements.lowercase"),
      met: /[a-z]/.test(formData.newPassword),
    },
  ];

  const passwordsMatch =
    formData.newPassword === formData.confirmPassword &&
    formData.confirmPassword.length > 0;
  const isFormValid =
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword &&
    passwordsMatch &&
    formData.newPassword.length >= 6;

  return (
    <div className="space-y-6">
      {/* method="post": a pre-hydration Enter would GET this form and put BOTH
          the current and the new password in the query string. */}
      <form method="post" onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {t("currentPassword")} <span className="text-destructive">*</span>
          </Label>
          <Password
            id="currentPassword"
            autoComplete="current-password"
            value={formData.currentPassword}
            onChange={(e) => handleChange("currentPassword", e.target.value)}
            placeholder={t("currentPasswordPlaceholder")}
            required
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              {t("newPassword")} <span className="text-destructive">*</span>
            </Label>
            <Password
              id="newPassword"
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              placeholder={t("newPasswordPlaceholder")}
              required
            />
            <p className="text-sm text-muted-foreground">{t("newPasswordHint")}</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              {t("confirmPassword")} <span className="text-destructive">*</span>
            </Label>
            <Password
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder={t("confirmPasswordPlaceholder")}
              required
              className={cn(
                formData.confirmPassword &&
                  (passwordsMatch
                    ? "border-green-500 focus-visible:ring-green-500"
                    : "border-destructive focus-visible:ring-destructive"),
              )}
            />
            {formData.confirmPassword && (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  passwordsMatch ? "text-green-600" : "text-destructive",
                )}
              >
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3" /> {t("passwordsMatch")}
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" /> {t("passwordsNoMatch")}
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            type="submit"
            disabled={!isFormValid || updatePassword.isPending}
            className="w-full sm:w-auto"
          >
            {updatePassword.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("changePassword")}
          </Button>
        </div>
      </form>
    </div>
  );
}
