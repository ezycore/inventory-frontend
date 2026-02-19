"use client";

import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { useUpdatePassword } from "@/services/api";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Check,
  X,
  KeyRound,
  Lock,
} from "lucide-react";
import { cn } from "@/ui/lib/utils";

export function PasswordChangeTab() {
  const updatePassword = useUpdatePassword();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        },
      }
    );
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Password requirements
  const requirements = [
    { label: "At least 6 characters", met: formData.newPassword.length >= 6 },
    { label: "Contains a number", met: /\d/.test(formData.newPassword) },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(formData.newPassword),
    },
    {
      label: "Contains lowercase letter",
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Current Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              placeholder="Enter your current password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPasswords.current ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              New Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                placeholder="Create a new password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                placeholder="Confirm your new password"
                required
                className={cn(
                  "pr-10",
                  formData.confirmPassword &&
                    (passwordsMatch
                      ? "border-green-500 focus-visible:ring-green-500"
                      : "border-destructive focus-visible:ring-destructive")
                )}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formData.confirmPassword && (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  passwordsMatch ? "text-green-600" : "text-destructive"
                )}
              >
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3" /> Passwords match
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" /> Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Password Requirements */}
        {formData.newPassword && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Password Requirements
            </p>
            <div className="grid grid-cols-2 gap-2">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-xs transition-colors",
                    req.met ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {req.met ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          </div>
        )}

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
            Change Password
          </Button>
        </div>
      </form>

      {/* Security Tips */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Security Tips</h3>
        </div>
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>Use a mix of letters, numbers, and symbols</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>Avoid personal information</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>Don&apos;t reuse passwords</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>Consider using a password manager</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
