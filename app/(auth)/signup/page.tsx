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
import { getRootDomain } from "@/lib/organization-utils";
import useDynamicForm from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";
import Image from "next/image";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Loader2,
  Package,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { type Control, useWatch } from "react-hook-form";
import { toast } from "sonner";

// Rich toggle card for the "load sample data" option. Used as a `custom`
// form field (with zodType "boolean") so it stays a boolean in the schema.
function SampleDataToggle({
  value,
  onChange,
}: {
  value?: boolean;
  onChange: (next: boolean) => void;
}) {
  const checked = Boolean(value);
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition-colors",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/10"
          : "border-input hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            checked
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary dark:bg-primary/15",
          )}
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Load sample data so I can explore
          </p>
          <p className="text-sm text-muted-foreground">
            Pre-fill your workspace with example products, stock, purchases and
            sales. You can clear it anytime.
          </p>
        </div>
      </div>
      {/* Display-only — the whole card handles the toggle. */}
      <Switch checked={checked} className="pointer-events-none mt-0.5" />
    </div>
  );
}

const ACCOUNT_FIELDS = ["firstName", "email", "password", "confirmPassword"];
const ORG_FIELDS = [
  "organizationName",
  "organizationSlug",
  "industry",
  "country",
  "timezone",
  "currency",
];

/**
 * Two-part progress for the setup form. Both parts are on screen at once, so
 * this reports what is actually filled in rather than pretending to be a wizard
 * — a static "step 2 pending" would be decoration, not information.
 *
 * Subscribes via `useWatch` inside its own component so a keystroke re-renders
 * this rail and not the whole page (and not DynamicForm with it).
 */
function SetupProgress({ control }: { control: Control<any> }) {
  const values = useWatch({ control, name: [...ACCOUNT_FIELDS, ...ORG_FIELDS] });
  const filled = (from: number, count: number) =>
    values.slice(from, from + count).every((v) => Boolean(v));

  const steps = [
    { label: "Your account", done: filled(0, ACCOUNT_FIELDS.length) },
    {
      label: "Your organization",
      done: filled(ACCOUNT_FIELDS.length, ORG_FIELDS.length),
    },
  ];

  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted text-muted-foreground",
              )}
            >
              {step.done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                step.done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

// Turn an organization name into a URL-safe slug (matches the slug field's
// `^[a-z0-9-]+$` validation): lowercase, non-alphanumerics → hyphens, trimmed.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

const ownerSetupFormConfig: DynamicFormConfig = {
  sections: [
    {
      title: "Your account",
      description: "You'll sign in with this",
      icon: <User className="h-4 w-4" />,
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
          placeholder: "Create a password",
          required: true,
          // Stated as persistent helper text rather than only a placeholder,
          // which disappears the moment they start typing.
          helperText: "Minimum 8 characters",
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
      title: "Your organization",
      description: "You can change all of this later",
      icon: <Building2 className="h-4 w-4" />,
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
          label: "Workspace address",
          columnSpan: 6,
          placeholder: "abc-manufacturing-ltd",
          required: true,
          // Rendered inside the field so the address is visible, not just
          // described. Omitted when NEXT_PUBLIC_ROOT_DOMAIN is unset (local dev
          // / single-host), where there is no subdomain to show.
          suffix: () => {
            const root = getRootDomain();
            return root ? `.${root}` : undefined;
          },
          validation: {
            minLength: 2,
            maxLength: 100,
            pattern: /^[a-z0-9-]+$/,
            patternMessage:
              "Only lowercase letters, numbers, and hyphens allowed",
          },
          tooltip:
            "Where you and your team will sign in. Lowercase letters, numbers and hyphens. Prefer your own domain? You can connect one later in Settings → Domains.",
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
          type: "custom",
          // Render as a rich toggle card while keeping a boolean in the schema.
          zodType: "boolean",
          defaultValue: false,
          label: "",
          columnSpan: 12,
          customComponent: SampleDataToggle,
        },
      ],
    },
  ],
};

export default function Signup() {
  const createOwnerMutation = useSignupAPi();
  const { form, config } = useDynamicForm(ownerSetupFormConfig);

  // Derived-field updates run from the form's onFieldChange, which fires
  // directly on every keystroke / selection (more reliable than a watch effect):
  //  - country  → re-applies that country's default timezone & currency
  //  - org name → auto-generates the slug, until the user edits the slug by hand
  const slugManuallyEditedRef = useRef(false);

  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      if (fieldName === "country") {
        const defaults = getCountryDefaults(value);
        if (defaults) {
          form.setValue("timezone", defaults.timezone, {
            shouldValidate: true,
          });
          form.setValue("currency", defaults.currency, {
            shouldValidate: true,
          });
        }
      } else if (fieldName === "organizationName") {
        if (!slugManuallyEditedRef.current) {
          form.setValue("organizationSlug", slugify(value || ""), {
            shouldValidate: Boolean(value),
          });
        }
      } else if (fieldName === "organizationSlug") {
        // User typed directly in the slug field → stop auto-generating it.
        slugManuallyEditedRef.current = true;
      }
    },
    [form],
  );

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
    // The submit button lives outside the <form> (see the sticky bar below), so
    // it doesn't inherit DynamicForm's own in-flight guard. Without this, a
    // double-click before `isPending` re-renders would create two organizations.
    if (createOwnerMutation.isPending) return;

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
    <div className="min-h-svh w-full bg-background lg:grid lg:grid-cols-[42fr_58fr]">
      {/* Branded panel */}
      {/* Gradient runs the logo palette itself — brand green (#0E8F73) into the
          mark's two navies — so the inverse logo mark sits on its own colours.
          Fixed hexes, not theme tokens: this panel is always a dark surface. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0E8F73] via-[#16335E] to-[#0A1A33] p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:gap-8">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#34D2AE]/20 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <Image
            src="/logo/ezycore-mark-inverse.svg"
            alt=""
            width={30}
            height={30}
          />
          <span className="text-lg font-semibold tracking-tight">EzyCore</span>
        </div>

        <div className="relative space-y-3">
          <h2 className="max-w-[13ch] text-3xl font-bold leading-[1.14] tracking-tight xl:text-4xl">
            Run your inventory with confidence.
          </h2>
          <p className="max-w-sm text-sm text-white/75">
            Stock, purchases and sales in one workspace — set up in about two
            minutes.
          </p>
        </div>

        {/* Pushed to the bottom so the pitch reads first and the panel has no
            dead band in the middle. */}
        <ul className="relative mt-auto">
          {SIGNUP_FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="flex items-center gap-3.5 border-t border-white/10 py-3 first:border-t-0"
            >
              <feature.icon className="h-4 w-4 shrink-0 text-[#6FE3C4]" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-white/60">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative text-xs text-white/50">
          © {currentYear} EzyCore. All rights reserved.
        </p>
      </aside>

      {/* Form panel. On lg it owns its own scroll so the action bar can stick to
          the column's bottom; on smaller screens the page scrolls and the bar
          sticks to the viewport instead. */}
      <main className="flex min-h-svh flex-col lg:h-svh lg:overflow-y-auto">
        <div className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-7">
            {/* Mobile lockup (the branded panel is hidden on small screens) */}
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src="/logo/ezycore-mark.svg"
                alt=""
                width={28}
                height={28}
              />
              <span className="text-lg font-semibold tracking-tight">
                EzyCore
              </span>
            </div>

            {/* Kept left-aligned in one column: the (auth) layout floats the
                language + theme toggles in the top-right corner. */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Create your workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                Two minutes, and you&apos;re in. Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {!createOwnerMutation.isPending && (
              <SetupProgress control={form.control} />
            )}

            {/* The filled form returns intact if the request fails, so this
                swap must not unmount it for any reason other than pending. */}
            {createOwnerMutation.isPending ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    Setting up your account…
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;re creating your workspace. This only takes a moment.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <DynamicForm
                  id="owner-setup-form"
                  className="space-y-7"
                  config={config}
                  form={form}
                  onFieldChange={handleFieldChange}
                  cancelLabel={null}
                  onSubmit={handleSubmit}
                  hideCancel={true}
                  // The submit lives in the sticky bar below, outside the
                  // <form>, reaching it by id.
                  hideActions={true}
                  sectionChrome="plain"
                />

                <p className="flex items-start gap-2.5 border-l-2 border-amber-500/70 bg-amber-500/5 px-3 py-2.5 text-xs text-muted-foreground">
                  <ShieldAlert className="mt-px h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <span>
                    This is the{" "}
                    <span className="font-medium text-foreground">
                      owner account
                    </span>{" "}
                    — full control over users, roles and settings. You can invite
                    your team once you&apos;re in.
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {!createOwnerMutation.isPending && (
          <div className="sticky bottom-0 border-t bg-background/95 px-5 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-8 lg:px-10">
            <div className="mx-auto flex w-full max-w-2xl flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                By creating an account you agree to the Terms and Privacy Policy.
              </p>
              {/* Native submit for the form rendered above — DynamicForm's own
                  button only calls the same handler, so this is equivalent. */}
              <Button
                type="submit"
                form="owner-setup-form"
                className="gap-2 sm:w-auto"
              >
                Create workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
