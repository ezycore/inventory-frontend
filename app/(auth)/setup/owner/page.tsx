// app/setup/owner/page.tsx

"use client";

import { Building2, Globe, User } from "lucide-react";
import { useCreateOwner } from "@/hooks/queries/use-setup";
import { toast } from "sonner";
import useDynamicForm from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { Card, CardContent } from "@/ui/components/card";

const ownerSetupFormConfig: DynamicFormConfig = {
  sections: [
    {
      title: "Personal Information",
      description: "Manage your personal details and contact information.",
      icon: <User className="h-5 w-5 text-blue-600" />,
      collapsible: false,
      fields: [
        {
          name: "firstName",
          type: "input",
          label: "First Name",
          columnSpan: 6,
          placeholder: "John",
          required: true,
        },
        {
          name: "lastName",
          type: "input",
          label: "Last Name",
          columnSpan: 6,
          placeholder: "Doe",
          required: true,
        },
        {
          name: "email",
          type: "input",
          label: "Email Address",
          columnSpan: 6,
          placeholder: "john@company.com",
          required: true,
        },
        {
          name: "phone",
          type: "input",
          label: "Phone Number",
          columnSpan: 6,
          placeholder: "+1 (234) 567-8900",
        },
        {
          name: "password",
          type: "password",
          label: "Password",
          columnSpan: 6,
          placeholder: "Min. 8 characters",
          required: true,
        },
        {
          name: "confirmPassword",
          type: "password",
          label: "Confirm Password",
          columnSpan: 6,
          placeholder: "Re-enter password",
          required: true,
        },
      ],
    },
    {
      title: "Organization Details",
      icon: <span className="text-orange-600 font-semibold">🖼</span>,
      collapsible: false,
      fields: [
        {
          name: "organizationName",
          type: "input",
          label: "Name",
          columnSpan: 6,
          placeholder: "ABC Manufacturing Ltd",
          required: true,
        },
        {
          name: "organizationSlug",
          type: "input",
          label: "Slug",
          columnSpan: 6,
          placeholder: "abc-manufacturing-ltd",
          required: true,
          description:
            "Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens allowed.",
        },
        {
          name: "industry",
          type: "select",
          label: "Industry",
          columnSpan: 6,
          placeholder: "Select industry",
          required: true,
          options: [
            { label: "Manufacturing", value: "Manufacturing" },
            { label: "Retail", value: "Retail" },
            { label: "Wholesale", value: "Wholesale" },
            { label: "Services", value: "Services" },
            { label: "Technology", value: "Technology" },
            { label: "Healthcare", value: "Healthcare" },
            { label: "Education", value: "Education" },
            { label: "Food & Beverage", value: "Food & Beverage" },
            { label: "Other", value: "Other" },
          ],
        },
        {
          name: "country",
          type: "select",
          label: "Country",
          columnSpan: 6,
          placeholder: "Select country",
          required: true,
          options: [
            { label: "🇺🇸 United States", value: "US" },
            { label: "🇬🇧 United Kingdom", value: "UK" },
            { label: "🇨🇦 Canada", value: "CA" },
            { label: "🇦🇺 Australia", value: "AU" },
            { label: "🇮🇳 India", value: "IN" },
            { label: "🇧🇩 Bangladesh", value: "BD" },
            { label: "🇵🇰 Pakistan", value: "PK" },
            { label: "🇸🇬 Singapore", value: "SG" },
            { label: "🇦🇪 UAE", value: "AE" },
          ],
        },
        {
          name: "timezone",
          type: "select",
          label: "Timezone",
          columnSpan: 6,
          placeholder: "Select timezone",
          required: true,
          options: [
            { label: "Eastern Time (ET)", value: "America/New_York" },
            { label: "Central Time (CT)", value: "America/Chicago" },
            { label: "Mountain Time (MT)", value: "America/Denver" },
            { label: "Pacific Time (PT)", value: "America/Los_Angeles" },
            { label: "London (GMT)", value: "Europe/London" },
            { label: "Central European (CET)", value: "Europe/Paris" },
            { label: "Dubai (GST)", value: "Asia/Dubai" },
            { label: "India (IST)", value: "Asia/Kolkata" },
            { label: "Bangladesh (BST)", value: "Asia/Dhaka" },
            { label: "Singapore (SGT)", value: "Asia/Singapore" },
            { label: "Sydney (AEDT)", value: "Australia/Sydney" },
          ],
        },
        {
          name: "currency",
          type: "select",
          label: "Currency",
          columnSpan: 6,
          placeholder: "Select currency",
          required: true,
          options: [
            { label: "USD - US Dollar ($)", value: "USD" },
            { label: "EUR - Euro (€)", value: "EUR" },
            { label: "GBP - British Pound (£)", value: "GBP" },
            { label: "CAD - Canadian Dollar (C$)", value: "CAD" },
            { label: "AUD - Australian Dollar (A$)", value: "AUD" },
            { label: "INR - Indian Rupee (₹)", value: "INR" },
            { label: "BDT - Bangladeshi Taka (৳)", value: "BDT" },
            { label: "PKR - Pakistani Rupee (₨)", value: "PKR" },
            { label: "SGD - Singapore Dollar (S$)", value: "SGD" },
            { label: "AED - UAE Dirham (د.إ)", value: "AED" },
          ],
        },
      ],
    },
  ],
};

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export default function OwnerSetupPage() {
  const createOwnerMutation = useCreateOwner();
  const { form, config } = useDynamicForm(ownerSetupFormConfig);

  const handleFieldChange = (fieldName: string, value: any) => {
    console.log(`Field changed: ${fieldName} = ${value}`);
    // // Auto-generate slug from organization name
    // if (fieldName === "organizationName") {
    //   const currentSlug = form.getValues("organizationSlug");
    //   const previousOrgName = form.getValues("organizationName");

    //   // Only auto-generate if slug hasn't been manually edited
    //   if (!currentSlug || currentSlug === generateSlug(previousOrgName)) {
    //     form.setValue("organizationSlug", generateSlug(value));
    //   }
    // }
  };

  const handleSubmit = (data: any) => {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password length
    if (data.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    createOwnerMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to EasyStock!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Let&apos;s set up your inventory management system. Create your
            owner account to get started.
          </p>
        </div>

        {/* Form */}
        <DynamicForm
          id="owner-setup-form"
          className="space-y-6"
          config={config}
          form={form}
          onFieldChange={handleFieldChange}
          cancelLabel={null}
          submitLabel={
            createOwnerMutation.isPending
              ? "Setting up your account..."
              : "Complete Setup & Create Account"
          }
          onSubmit={handleSubmit}
          contentLoading={createOwnerMutation.isPending}
          hideCancel={true}
        />

        {/* Info Note */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 mt-6">
          <CardContent className="flex gap-3 py-4">
            <Globe className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">
                Important Information
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-500">
                You are creating the owner account with full administrative
                access. This account will have complete control over user
                management, roles, permissions, and all system settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
