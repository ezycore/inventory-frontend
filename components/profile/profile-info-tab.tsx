"use client";

import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { useUpdateProfile } from "@/hooks/queries/use-profile";
import { useAuthStore } from "@/stores/use-auth-store";
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ChangeDefaultLocationDialog } from "./ChangeDefaultLocationDialog";

export function ProfileInfoTab() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  // Initialize form data using useMemo to avoid cascading renders
  const initialFormData = useMemo(() => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }), [user?.firstName, user?.lastName, user?.email, user?.phone]);

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

  const hasChanges =
    formData.firstName !== user?.firstName ||
    formData.lastName !== user?.lastName ||
    formData.phone !== user?.phone;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Enter first name"
            required
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Enter last name"
            required
          />
        </div>

        {/* Email (Disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={formData.email}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      {/* Default Location Section */}
      <div className="border-t pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Default Location</h3>
            <p className="text-sm text-muted-foreground">
              Change your default location for when you log in
            </p>
          </div>
          <ChangeDefaultLocationDialog />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!hasChanges || updateProfile.isPending}
        >
          {updateProfile.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
