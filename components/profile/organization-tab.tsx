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
import { useAuthStore } from "@/stores/use-auth-store";
import { useState, useMemo } from "react";
import { Loader2, Lock } from "lucide-react";
import { useUpdateOrganization } from "@/hooks/queries/use-profile";
import { countryOptions, currencyOptions, timezoneOptions } from "@/app/(auth)/signup/page";

export function OrganizationTab() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Initialize form data using useMemo to avoid cascading renders
  const initialFormData = useMemo(() => ({
    name: user?.organization?.name || "",
    address: user?.organization?.address || "",
    country: user?.organization?.country || "",
    timezone: user?.organization?.timezone || "",
    currency: user?.organization?.currency || "",
  }), [
    user?.organization?.name,
    user?.organization?.address,
    user?.organization?.country,
    user?.organization?.timezone,
    user?.organization?.currency,
  ]);

  const [formData, setFormData] = useState(initialFormData);

  const updateOrganization = useUpdateOrganization();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization.mutate(formData);
  };

  const hasChanges =
    formData.name !== user?.organization?.name ||
    formData.address !== user?.organization?.address ||
    formData.country !== user?.organization?.country ||
    formData.timezone !== user?.organization?.timezone ||
    formData.currency !== user?.organization?.currency;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Access Restricted</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Only administrators can view and modify organization settings.
          Please contact your administrator if you need to make changes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Name */}
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

      {/* Slug (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="slug">Organization Slug</Label>
        <Input
          id="slug"
          value={user?.organization?.slug || ""}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Slug cannot be changed as it&apos;s used in your organization&apos;s URL
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
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

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
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

        {/* Timezone */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={formData.timezone} onValueChange={(value) => handleChange("timezone", value)}>
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

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Enter organization address"
          rows={3}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={!hasChanges || updateOrganization.isPending}
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
