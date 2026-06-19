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
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";
import {
  BarChart3,
  Building2,
  Package,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

// Highlights shown on the branded panel beside the signup form.
const SIGNUP_FEATURES = [
  {
    icon: Package,
    title: "Real-time stock tracking",
    description: "Across every location, always in sync.",
  },
  {
    icon: Receipt,
    title: "Purchases, sales & returns",
    description: "One streamlined flow from end to end.",
  },
  {
    icon: BarChart3,
    title: "Insightful analytics",
    description: "Low-stock alerts and clear reports.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Role-based access and full control.",
  },
];

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
      description: "Your details for the owner account.",
      icon: <User className="h-5 w-5 text-orange-600" />,
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
      description: "Set up your workspace and regional preferences.",
      icon: <Building2 className="h-5 w-5 text-orange-600" />,
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
        {
          name: "loadSampleData",
          type: "switch",
          label: "Load sample data so I can explore",
          columnSpan: 12,
          description:
            "Pre-fills your workspace with example products, stock, purchases and sales. You can clear it anytime.",
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

  // `/signup?demo=true` pre-enables the "load sample data" switch so the new
  // (real) account lands fully populated. It stays a normal, permanent workspace
  // — the seeded rows are `isDemoData` and can be wiped via the demo banner's
  // one-click reset. The user can still toggle the switch off before submitting.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") {
      form.setValue("loadSampleData", true, { shouldValidate: false });
    }
  }, [form]);

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

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-svh w-full bg-gray-50 dark:bg-gray-950 lg:grid lg:grid-cols-2">
      {/* Branded panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-between">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">EzyCore</span>
        </div>

        {/* Pitch + feature highlights */}
        <div className="relative space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight xl:text-4xl">
              Run your inventory with confidence.
            </h2>
            <p className="max-w-md text-blue-100">
              Everything you need to manage stock, purchases, and sales — in one
              simple workspace.
            </p>
          </div>

          <ul className="space-y-5">
            {SIGNUP_FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-blue-100">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-blue-200">
          © {currentYear} EzyCore. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
        <div className="w-full max-w-xl">
          {/* Mobile logo (branded panel is hidden on small screens) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
              EzyCore
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Create your owner account
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Set up your inventory workspace in a couple of minutes.{" "}
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <DynamicForm
            id="owner-setup-form"
            className="space-y-5"
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

          {/* Owner-access note */}
          <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">
                You&apos;re creating the owner account
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-500">
                This account has full administrative access — complete control
                over user management, roles, permissions, and all system
                settings.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </main>
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
