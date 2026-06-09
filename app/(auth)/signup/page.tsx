// app/(auth)/signup/page.tsx

"use client";

import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  getCountryDefaults,
  INDUSTRY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/constants/organization-options";
import { useSignupAPi } from "@/hooks";
import useDynamicForm from "@/hooks/use-dynamic-form";
import { Card, CardContent } from "@/ui/components/card";
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { Building2, Globe, User } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

// Re-export for backward compatibility with organization-tab.tsx
export {
  COUNTRY_OPTIONS as countryOptions,
  CURRENCY_OPTIONS as currencyOptions,
  INDUSTRY_OPTIONS,
  TIMEZONE_OPTIONS as timezoneOptions,
} from "@/constants/organization-options";

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
          validation: { minLength: 2, maxLength: 100 },
        },
        {
          name: "lastName",
          type: "input",
          label: "Last Name",
          columnSpan: 6,
          placeholder: "Doe",
          validation: { maxLength: 100 },
        },
        {
          name: "email",
          type: "input",
          label: "Email Address",
          columnSpan: 6,
          placeholder: "john@company.com",
          required: true,
          validation: { email: true },
        },
        {
          name: "phone",
          type: "input",
          label: "Phone Number",
          columnSpan: 6,
          placeholder: "+1 (234) 567-8900",
          validation: { maxLength: 20 },
        },
        {
          name: "password",
          type: "password",
          label: "Password",
          columnSpan: 6,
          placeholder: "Min. 8 characters",
          required: true,
          validation: { minLength: 8 },
        },
        {
          name: "confirmPassword",
          type: "password",
          label: "Confirm Password",
          columnSpan: 6,
          placeholder: "Re-enter password",
          required: true,
          validation: { minLength: 8 },
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
          label: "Organization Name",
          columnSpan: 6,
          placeholder: "ABC Manufacturing Ltd",
          required: true,
          validation: { minLength: 2, maxLength: 200 },
        },
        {
          name: "organizationSlug",
          type: "input",
          label: "Slug",
          columnSpan: 6,
          placeholder: "abc-manufacturing-ltd",
          required: true,
          validation: {
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-z0-9-]+$/,
            patternMessage:
              "Only lowercase letters, numbers, and hyphens allowed",
          },
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
          options: INDUSTRY_OPTIONS,
        },
        {
          name: "country",
          type: "select",
          label: "Country",
          columnSpan: 6,
          placeholder: "Select country",
          required: true,
          options: COUNTRY_OPTIONS,
        },
        {
          name: "timezone",
          type: "select",
          label: "Timezone",
          columnSpan: 6,
          placeholder: "Select timezone",
          required: true,
          options: TIMEZONE_OPTIONS,
        },
        {
          name: "currency",
          type: "select",
          label: "Currency",
          columnSpan: 6,
          placeholder: "Select currency",
          required: true,
          options: CURRENCY_OPTIONS,
        },
      ],
    },
  ],
};

export default function Signup() {
  const createOwnerMutation = useSignupAPi();
  const { form, config } = useDynamicForm(ownerSetupFormConfig);

  // Watch country field and auto-suggest timezone/currency
  const selectedCountry = form.watch("country");

  useEffect(() => {
    if (selectedCountry) {
      const defaults = getCountryDefaults(selectedCountry);
      if (defaults) {
        // Only set if fields are empty (don't override user selections)
        const currentTimezone = form.getValues("timezone");
        const currentCurrency = form.getValues("currency");

        if (!currentTimezone) {
          form.setValue("timezone", defaults.timezone, { shouldValidate: true });
        }
        if (!currentCurrency) {
          form.setValue("currency", defaults.currency, { shouldValidate: true });
        }
      }
    }
  }, [selectedCountry, form]);

  const handleSubmit = (data: Record<string, any>) => {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password length (schema already enforces this, belt-and-suspenders)
    if (data.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    createOwnerMutation.mutate({
      ...data,
      ...getSignupPlanFromUrl(),
    });
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

function getSignupPlanFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const planName =
    params.get("planName") || params.get("plan") || params.get("planSlug");
  const planSlug = params.get("planSlug") || undefined;

  return {
    planName: planName?.trim() || "free",
    ...(planSlug && { planSlug }),
  };
}
