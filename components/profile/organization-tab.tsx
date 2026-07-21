"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Loader2,
  Lock,
  Building2,
  Globe,
  Clock,
  DollarSign,
  MapPin,
  Link2,
  Camera,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { useUpdateOrganization } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { toast } from "sonner";
import {
  countryOptions,
  currencyOptions,
  timezoneOptions,
} from "@/app/(auth)/signup/page";
import { getCountryDefaults } from "@/constants/organization-options";
import { useGetOrganizationApi } from "@/hooks";
import { isFeatureEnabled } from "@/lib/feature-utils";
import { EmailReportsSection } from "./email-reports-section";

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB — must match backend uploadConfig limit

export function OrganizationTab() {
  const t = useTranslations("settings.organization");
  const tTab = useTranslations("settings.organization.tab");
  const { data } = useGetOrganizationApi();
  const {
    address,
    country,
    currency,
    name,
    timezone,
    logo,
    features,
    notificationSettings,
  } = data?.data || {};
  // Report-email defaults mirror the backend schema: enabled, 21:00 (sales) and
  // 08:00 (expiry) org-local.
  const serverDigestEnabled: boolean =
    notificationSettings?.salesDigest?.enabled ?? true;
  const serverDigestHour: number = notificationSettings?.salesDigest?.hour ?? 21;
  const serverExpiryEnabled: boolean =
    notificationSettings?.expiryDigest?.enabled ?? true;
  const serverExpiryHour: number = notificationSettings?.expiryDigest?.hour ?? 8;
  const { user } = useAuthStore();

  const canManageOrganization =
    !!user?.permissions?.includes("organization.edit") ||
    !!user?.permissions?.includes("organization.manage");

  const fileInputRef = useRef<HTMLInputElement>(null);
  // `null` = no pending change. `File` = upload pending. `"remove"` = clear pending.
  const [pendingLogo, setPendingLogo] = useState<File | "remove" | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Build & cleanup blob URL for the chosen file so it never leaks.
  useEffect(() => {
    if (pendingLogo instanceof File) {
      const url = URL.createObjectURL(pendingLogo);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoPreview(null);
  }, [pendingLogo]);

  const currentLogoUrl =
    pendingLogo === "remove"
      ? null
      : logoPreview ?? logo?.thumbnailUrl ?? logo?.url ?? null;

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageType"));
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      toast.error(t("logoTooLarge"));
      return;
    }
    setPendingLogo(file);
  };

  // Initialize form data using useMemo to avoid cascading renders
  const initialFormData = useMemo(
    () => ({
      name: name || "",
      address: address || "",
      country: country || "",
      timezone: timezone || "",
      currency: currency || "",
      salesDigestEnabled: serverDigestEnabled,
      salesDigestHour: String(serverDigestHour),
      expiryDigestEnabled: serverExpiryEnabled,
      expiryDigestHour: String(serverExpiryHour),
    }),
    [
      name,
      address,
      country,
      timezone,
      currency,
      serverDigestEnabled,
      serverDigestHour,
      serverExpiryEnabled,
      serverExpiryHour,
    ]
  );

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const updateOrganization = useUpdateOrganization();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // When country changes, auto-fill timezone & currency from country defaults
  // — but only when those fields are still empty, so we don't overwrite the
  // user's explicit choices. Mirrors the behaviour of the signup form.
  const handleCountryChange = (value: string) => {
    setFormData((prev) => {
      const next = { ...prev, country: value };
      const defaults = getCountryDefaults(value);
      if (defaults) {
        if (!prev.timezone) next.timezone = defaults.timezone;
        if (!prev.currency) next.currency = defaults.currency;
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.country || !formData.timezone || !formData.currency) {
      return;
    }

    // Use FormData when there's a logo upload/removal so multer can parse it;
    // otherwise fall back to plain JSON for cleanliness.
    if (pendingLogo) {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("address", formData.address);
      fd.append("country", formData.country);
      fd.append("timezone", formData.timezone);
      fd.append("currency", formData.currency);
      fd.append("salesDigestEnabled", String(formData.salesDigestEnabled));
      fd.append("salesDigestHour", formData.salesDigestHour);
      fd.append("expiryDigestEnabled", String(formData.expiryDigestEnabled));
      fd.append("expiryDigestHour", formData.expiryDigestHour);
      if (pendingLogo instanceof File) {
        fd.append("logo", pendingLogo);
      } else {
        fd.append("removeLogo", "true");
      }
      updateOrganization.mutate(fd, {
        onSuccess: () => setPendingLogo(null),
      });
      return;
    }

    updateOrganization.mutate({
      name: formData.name,
      address: formData.address,
      country: formData.country,
      timezone: formData.timezone,
      currency: formData.currency,
      salesDigestEnabled: formData.salesDigestEnabled,
      salesDigestHour: Number(formData.salesDigestHour),
      expiryDigestEnabled: formData.expiryDigestEnabled,
      expiryDigestHour: Number(formData.expiryDigestHour),
    });
  };

  const hasChanges =
    pendingLogo !== null ||
    formData.name !== name ||
    formData.address !== (address || "") ||
    formData.country !== country ||
    formData.timezone !== timezone ||
    formData.currency !== currency ||
    formData.salesDigestEnabled !== serverDigestEnabled ||
    formData.salesDigestHour !== String(serverDigestHour) ||
    formData.expiryDigestEnabled !== serverExpiryEnabled ||
    formData.expiryDigestHour !== String(serverExpiryHour);

  const canSubmit =
    hasChanges &&
    !!formData.name &&
    !!formData.country &&
    !!formData.timezone &&
    !!formData.currency;

  if (!canManageOrganization) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("accessRestrictedTitle")}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {t("accessRestrictedDescription")}
        </p>
      </div>
    );
  }

  const initials = (formData.name || name || "O")
    .split(" ")
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Logo */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>{tTab("logoSectionLabel")}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 rounded-lg border-2 border-background shadow ring-1 ring-border">
              {currentLogoUrl ? (
                <AvatarImage
                  key={currentLogoUrl}
                  src={currentLogoUrl}
                  alt={formData.name || tTab("logoSectionLabel")}
                  className="object-contain bg-muted"
                />
              ) : null}
              <AvatarFallback className="rounded-lg text-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              {tTab("logoHint")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {currentLogoUrl ? tTab("changeLogo") : tTab("uploadLogo")}
              </Button>
              {currentLogoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setPendingLogo("remove")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tTab("removeLogo")}
                </Button>
              )}
              {pendingLogo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingLogo(null)}
                >
                  {tTab("cancel")}
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={handleLogoSelect}
            />
          </div>
        </div>
      </div>

      {/* Organization Identity */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{tTab("identitySectionLabel")}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orgName">
              {tTab("orgName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orgName"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={tTab("orgNamePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              {tTab("slug")}
            </Label>
            <Input
              id="slug"
              value={user?.organization?.slug || ""}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {tTab("slugHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>{tTab("regionalSectionLabel")}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {tTab("country")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.country}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tTab("countryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              {tTab("currency")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleChange("currency", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tTab("currencyPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="timezone" className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {tTab("timezone")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleChange("timezone", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tTab("timezonePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{tTab("addressSectionLabel")}</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{tTab("address")}</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder={tTab("addressPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      <EmailReportsSection
        salesDigest={{
          enabled: formData.salesDigestEnabled,
          hour: formData.salesDigestHour,
        }}
        expiryDigest={{
          enabled: formData.expiryDigestEnabled,
          hour: formData.expiryDigestHour,
        }}
        showExpiryDigest={isFeatureEnabled(features, "expiryTracking")}
        onSalesDigestChange={({ enabled, hour }) =>
          setFormData((prev) => ({
            ...prev,
            salesDigestEnabled: enabled,
            salesDigestHour: hour,
          }))
        }
        onExpiryDigestChange={({ enabled, hour }) =>
          setFormData((prev) => ({
            ...prev,
            expiryDigestEnabled: enabled,
            expiryDigestHour: hour,
          }))
        }
      />

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          disabled={!canSubmit || updateOrganization.isPending}
          className="w-full sm:w-auto"
        >
          {updateOrganization.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {tTab("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
