"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { useUpdateProfile, useMyLocations } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useState, useMemo, useEffect } from "react";
import { Loader2, MapPin, User, Mail } from "lucide-react";
import { ChangeDefaultLocationDialog } from "./change-default-location-dialog";

export function ProfileInfoTab() {
  const t = useTranslations("settings.profile.info");
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const { data: locationsData } = useMyLocations();

  // Find the user's current default location to show its name in the UI.
  const currentDefaultLocation = useMemo(() => {
    const locations = locationsData?.data || [];
    if (!user?.defaultLocationId) return null;
    return (
      locations.find(
        (loc: any) =>
          loc._id === user.defaultLocationId || loc.id === user.defaultLocationId,
      ) ?? null
    );
  }, [locationsData?.data, user?.defaultLocationId]);

  const hasMultipleLocations = (locationsData?.data?.length ?? 0) > 1;

  // Initialize form data using useMemo to avoid cascading renders
  const initialFormData = useMemo(
    () => ({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }),
    [user?.firstName, user?.lastName, user?.email, user?.phone]
  );

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append("firstName", formData.firstName);
    data.append("lastName", formData.lastName);
    data.append("phone", formData.phone || "");

    updateProfile.mutate(data);
  };

  // Compare against `initialFormData`, not `user`: the optional fields
  // (lastName, phone) are normalized to "" there, so comparing to the raw
  // `undefined` on the user marked the form permanently dirty for anyone
  // without a last name.
  const hasChanges =
    formData.firstName !== initialFormData.firstName ||
    formData.lastName !== initialFormData.lastName ||
    formData.phone !== initialFormData.phone;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{t("personalInfo")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              {t("firstName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder={t("firstNamePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">{t("lastName")}</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder={t("lastNamePlaceholder")}
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{t("contactInfo")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              value={formData.email}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {t("emailHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder={t("phonePlaceholder")}
            />
          </div>
        </div>
      </div>

      {/* Default Location Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{t("defaultLocation")}</span>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentDefaultLocation?.name ?? t("noDefaultLocation")}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentDefaultLocation
                  ? t("defaultLocationSetHint")
                  : t("defaultLocationUnsetHint")}
              </p>
            </div>
            {hasMultipleLocations && <ChangeDefaultLocationDialog />}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          disabled={!hasChanges || updateProfile.isPending}
          className="w-full sm:w-auto"
        >
          {updateProfile.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
