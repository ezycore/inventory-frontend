"use client";

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

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB — must match backend uploadConfig limit

export function OrganizationTab() {
  const { data } = useGetOrganizationApi();
  const { address, country, currency, name, timezone, logo } = data?.data || {};
  const { user } = useAuthStore();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

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
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      toast.error("Logo must be smaller than 5MB");
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
    }),
    [name, address, country, timezone, currency]
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
    });
  };

  const hasChanges =
    pendingLogo !== null ||
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

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Access Restricted</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Only administrators can view and modify organization settings. Please
          contact your administrator if you need to make changes.
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
          <span>Organization Logo</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 rounded-lg border-2 border-background shadow ring-1 ring-border">
              {currentLogoUrl ? (
                <AvatarImage
                  key={currentLogoUrl}
                  src={currentLogoUrl}
                  alt={formData.name || "Organization logo"}
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
              PNG, JPG, SVG or WebP. Square images work best. Max 5MB.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {currentLogoUrl ? "Change logo" : "Upload logo"}
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
                  Remove
                </Button>
              )}
              {pendingLogo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingLogo(null)}
                >
                  Cancel
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
          <span>Organization Identity</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orgName">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orgName"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter organization name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Organization Slug
            </Label>
            <Input
              id="slug"
              value={user?.organization?.slug || ""}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Used in your organization&apos;s URL
            </p>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Regional Settings</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Country <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.country}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select country" />
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
              Currency <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleChange("currency", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
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
              Timezone <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleChange("timezone", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select timezone" />
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
          <span>Business Address</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter organization address"
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
          Save Changes
        </Button>
      </div>
    </form>
  );
}
