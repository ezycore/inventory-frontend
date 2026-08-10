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
import { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Lock,
  AppWindow,
  Building2,
  Globe,
  Clock,
  DollarSign,
  MapPin,
  Link2,
  ImageIcon,
} from "lucide-react";
import NextImage from "next/image";
import { useUpdateOrganization } from "@/services/api";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import {
  useImageUploadField,
  type ImageRejection,
} from "@/hooks/use-image-upload-field";
import { toast } from "sonner";
import {
  COUNTRY_OPTIONS as countryOptions,
  CURRENCY_OPTIONS as currencyOptions,
  TIMEZONE_OPTIONS as timezoneOptions,
  getCountryDefaults,
} from "@/constants/organization-options";
import { useGetOrganizationApi } from "@/hooks";
import { isFeatureEnabled } from "@/lib/feature-utils";

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
    favicon,
    features,
  } = data?.data || {};
  // The daily-summary and expiry-report schedules used to live here. They moved
  // to Settings → Notifications, where they sit beside every other message the
  // product sends and share its on/off matrix.
  const { user } = useAuthStore();

  const canManageOrganization =
    !!user?.permissions?.includes("organization.edit") ||
    !!user?.permissions?.includes("organization.manage");

  // Two independent image fields, both staged until the form's own Save. They
  // are separate uploads because they do separate jobs: the logo is a brand
  // mark rendered large, the favicon is the sole source of the browser-tab icon
  // and is never derived from the logo.
  const logoField = useImageUploadField(logo?.thumbnailUrl ?? logo?.url);
  const faviconField = useImageUploadField(
    favicon?.thumbnailUrl ?? favicon?.url,
  );

  const rejectLogo = (reason: ImageRejection) =>
    toast.error(reason === "type" ? t("invalidImageType") : t("logoTooLarge"));
  const rejectFavicon = (reason: ImageRejection) =>
    toast.error(
      reason === "type" ? t("invalidImageType") : t("faviconTooLarge"),
    );

  // Initialize form data using useMemo to avoid cascading renders
  const initialFormData = useMemo(
    () => ({
      name: name || "",
      address: address || "",
      country: country || "",
      timezone: timezone || "",
      currency: currency || "",
    }),
    [
      name,
      address,
      country,
      timezone,
      currency,
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

    // Use FormData when there's an image upload/removal so multer can parse it;
    // otherwise fall back to plain JSON for cleanliness. Either field can carry
    // a change on its own, and the backend treats them independently.
    if (logoField.pending || faviconField.pending) {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("address", formData.address);
      fd.append("country", formData.country);
      fd.append("timezone", formData.timezone);
      fd.append("currency", formData.currency);
      if (logoField.pending instanceof File) {
        fd.append("logo", logoField.pending);
      } else if (logoField.pending === "remove") {
        fd.append("removeLogo", "true");
      }
      if (faviconField.pending instanceof File) {
        fd.append("favicon", faviconField.pending);
      } else if (faviconField.pending === "remove") {
        fd.append("removeFavicon", "true");
      }
      updateOrganization.mutate(fd, {
        onSuccess: () => {
          logoField.clear();
          faviconField.clear();
        },
      });
      return;
    }

    updateOrganization.mutate({
      name: formData.name,
      address: formData.address,
      country: formData.country,
      timezone: formData.timezone,
      currency: formData.currency,
    });
  };

  const hasChanges =
    logoField.pending !== null ||
    faviconField.pending !== null ||
    formData.name !== name ||
    formData.address !== (address || "") ||
    formData.country !== country ||
    formData.timezone !== timezone ||
    formData.currency !== currency;

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
      <ImageUploadField
        sectionIcon={<ImageIcon className="h-4 w-4" />}
        sectionLabel={tTab("logoSectionLabel")}
        hint={tTab("logoHint")}
        currentUrl={logoField.currentUrl}
        fallback={initials}
        fallbackClassName="rounded-lg text-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold"
        alt={formData.name || tTab("logoSectionLabel")}
        pending={logoField.pending}
        labels={{
          upload: tTab("uploadLogo"),
          change: tTab("changeLogo"),
          remove: tTab("removeLogo"),
          cancel: tTab("cancel"),
        }}
        onPick={(file) => logoField.select(file, rejectLogo)}
        onRemove={logoField.remove}
        onCancel={logoField.clear}
      />

      {/* Browser tab icon — the single source of the favicon everywhere. */}
      <ImageUploadField
        sectionIcon={<AppWindow className="h-4 w-4" />}
        sectionLabel={tTab("faviconSectionLabel")}
        hint={
          <>
            {tTab("faviconHint")}
            {!faviconField.currentUrl && (
              <span className="mt-1 block text-xs">
                {tTab("faviconEmptyHint")}
              </span>
            )}
          </>
        }
        currentUrl={faviconField.currentUrl}
        /* The empty state shows the real platform mark rather than the org
           initials: that image IS what tabs display when no favicon is set, so
           the tile answers "what am I getting?" instead of implying the logo
           will be used. Paired with `faviconEmptyHint`, which says it in words. */
        fallback={
          <NextImage
            src="/icon.png"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="h-8 w-8 opacity-40"
          />
        }
        fallbackClassName="rounded-lg bg-muted"
        alt={tTab("faviconSectionLabel")}
        pending={faviconField.pending}
        labels={{
          upload: tTab("uploadFavicon"),
          change: tTab("changeFavicon"),
          remove: tTab("removeFavicon"),
          cancel: tTab("cancel"),
        }}
        onPick={(file) => faviconField.select(file, rejectFavicon)}
        onRemove={faviconField.remove}
        onCancel={faviconField.clear}
      />

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
