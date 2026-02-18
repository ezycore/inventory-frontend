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
import { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  Lock,
  Building2,
  Globe,
  Clock,
  DollarSign,
  MapPin,
  Link2,
} from "lucide-react";
import { useUpdateOrganization } from "@/services/api";
import {
  countryOptions,
  currencyOptions,
  timezoneOptions,
} from "@/app/(auth)/signup/page";
import { useGetOrganizationApi } from "@/hooks";

export function OrganizationTab() {
  const { data } = useGetOrganizationApi();
  const { address, country, currency, name, timezone } = data?.data || {};
  const { user } = useAuthStore();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("address", formData.address);
    data.append("country", formData.country);
    data.append("timezone", formData.timezone);
    data.append("currency", formData.currency);
    updateOrganization.mutate(data);
  };

  const hasChanges =
    formData.name !== name ||
    formData.address !== address ||
    formData.country !== country ||
    formData.timezone !== timezone ||
    formData.currency !== currency;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Identity */}
      <div className="space-y-4">
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
              Country
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleChange("country", value)}
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
              Currency
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
              Timezone
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
          disabled={!hasChanges || updateOrganization.isPending}
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
