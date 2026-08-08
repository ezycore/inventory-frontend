"use client";
// coding-standard: maintained

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { ownerSetupFormConfig } from "@/components/setup/owner/owner-setup-form-config";
import { SetupProgress } from "@/components/setup/owner/setup-progress";
import {
  SignupBrandPanel,
  SignupHighlightStrip,
} from "@/components/setup/owner/signup-brand-panel";
import { BRAND, LEGAL_URLS } from "@/constants/brand";
import { getCountryDefaults } from "@/constants/organization-options";
import { useSignupAPi } from "@/hooks";
import useDynamicForm from "@/hooks/use-dynamic-form";
import { slugify } from "@/utils/slugify";
import { Button } from "@/ui/components/button";
import DynamicForm from "@/ui/components/form";

/** Query params that carry a chosen plan across from the marketing site. */
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

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Schema already enforces this — belt and suspenders.
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
    <div className="min-h-svh w-full bg-background lg:grid lg:grid-cols-[42fr_58fr]">
      <SignupBrandPanel />

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
                {BRAND.name}
              </span>
            </div>

            {/* Kept left-aligned in one column: the (auth) layout floats the
                language + theme toggles in the top-right corner. */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Create your workspace and online store
              </h1>
              <p className="text-sm text-muted-foreground">
                Two minutes, and you&apos;re in — with a storefront ready to
                publish. Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <SignupHighlightStrip />

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
              {/* Passive consent, deliberately not a checkbox — the links must
                  reach the public marketing site, which is a different origin. */}
              <p className="text-xs text-muted-foreground">
                By creating an account you agree to the{" "}
                <a
                  href={LEGAL_URLS.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href={LEGAL_URLS.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Privacy Policy
                </a>
                .
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
