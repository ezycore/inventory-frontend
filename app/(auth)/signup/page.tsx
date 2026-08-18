"use client";
// coding-standard: maintained

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { getOwnerSetupFormConfig } from "@/components/setup/owner/owner-setup-form-config";
import { SetupProgress } from "@/components/setup/owner/setup-progress";
import {
  SignupBrandPanel,
  SignupHighlightStrip,
} from "@/components/setup/owner/signup-brand-panel";
import { SignupPlanNote } from "@/components/setup/owner/signup-plan-note";
import { BRAND, LEGAL_URLS } from "@/constants/brand";
import { getCountryDefaults } from "@/constants/organization-options";
import { useHydrated, useSignupAPi } from "@/hooks";
import useDynamicForm from "@/hooks/use-dynamic-form";
import { detectCountryCode } from "@/utils/detect-country";
import { getSignupPlanFromUrl } from "@/utils/signup-plan";
import { slugify } from "@/utils/slugify";
import { Button } from "@/ui/components/button";
import DynamicForm from "@/ui/components/form";

export default function Signup() {
  const t = useTranslations("auth.signup");
  const locale = useLocale();
  const createOwnerMutation = useSignupAPi();

  // The sticky-bar submit below is this form's default button — it lives outside
  // the <form> and reaches it by id, so Enter in any field fires it. A disabled
  // default button is skipped by implicit submission entirely, which closes the
  // pre-hydration native-submit window from the other side of DynamicForm's
  // `method="post"`. False on the server and on the hydration render, so no
  // mismatch; the button is only ever dead while a click wouldn't have worked.
  const hydrated = useHydrated();
  // Memoized on `t`: `useDynamicForm` keys its schema, resolver and default
  // values off the config's identity, so an unstable config would rebuild the
  // form on every keystroke. `t` changes only when the locale does.
  const formConfig = useMemo(() => getOwnerSetupFormConfig(t), [t]);
  const { form, config } = useDynamicForm(formConfig);

  // Derived-field updates run from the form's onFieldChange, which fires
  // directly on every keystroke / selection (more reliable than a watch effect):
  //  - country  → re-applies that country's default timezone & currency
  //  - org name → auto-generates the slug, until the user edits the slug by hand
  const slugManuallyEditedRef = useRef(false);

  const applyCountryDefaults = useCallback(
    (countryCode: string) => {
      const defaults = getCountryDefaults(countryCode);
      if (!defaults) return;
      form.setValue("timezone", defaults.timezone, { shouldValidate: true });
      form.setValue("currency", defaults.currency, { shouldValidate: true });
    },
    [form],
  );

  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      if (fieldName === "country") {
        applyCountryDefaults(value);
      } else if (fieldName === "organizationName") {
        if (!slugManuallyEditedRef.current) {
          const suggestion = slugify(value || "");
          // A name with no Latin characters — "রহিম ফার্মেসি" — slugifies to
          // the empty string. Leave the field blank and let them type it:
          // never validate here, or a required-field error lands on a control
          // they have not touched, blaming them for their own shop's name. We
          // don't generate a substitute either — this address is what they and
          // their customers have to remember, so it is theirs to choose.
          form.setValue("organizationSlug", suggestion, {
            shouldValidate: Boolean(suggestion),
          });
        }
      } else if (fieldName === "organizationSlug") {
        // User typed directly in the slug field → stop auto-generating it.
        slugManuallyEditedRef.current = true;
      }
    },
    [applyCountryDefaults, form],
  );

  // Pre-select the country the visitor is actually in, which fills timezone and
  // currency with it. Otherwise a Dhaka merchant has to find Bangladesh in a
  // list of fourteen and Asia/Dhaka in a list of seventeen, on the screen where
  // they have least patience for either. Runs client-side only (the detection
  // reads `Intl`/`navigator`), and only while the field is still untouched.
  useEffect(() => {
    if (form.getValues("country")) return;
    const detected = detectCountryCode();
    if (!detected) return;
    form.setValue("country", detected, { shouldValidate: true });
    applyCountryDefaults(detected);
  }, [applyCountryDefaults, form]);

  // `/signup?demo=false` opts OUT of the sample data that is otherwise on by
  // default. The seeded rows are `isDemoData` and can be wiped via the demo
  // banner's one-click reset; the workspace itself is normal and permanent.
  // The user can still flip the switch either way before submitting.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "true" || demo === "false") {
      form.setValue("loadSampleData", demo === "true", {
        shouldValidate: false,
      });
    }
  }, [form]);

  const handleSubmit = (data: Record<string, any>) => {
    // The submit button lives outside the <form> (see the sticky bar below), so
    // it doesn't inherit DynamicForm's own in-flight guard. Without this, a
    // double-click before `isPending` re-renders would create two organizations.
    if (createOwnerMutation.isPending) return;

    if (data.password !== data.confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    // Schema already enforces this — belt and suspenders.
    if (data.password.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }

    createOwnerMutation.mutate({
      ...data,
      // The language this form was filled in. The backend stores it on the new
      // owner and sends the verification email in it — a merchant who signs up
      // in Bangla should not get their first email from us in English.
      locale,
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
                {t("title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("subtitle")} {t("haveAccount")}{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("signIn")}
                </Link>
              </p>
            </div>

            <SignupPlanNote />

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
                  <p className="text-lg font-semibold">{t("creatingTitle")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("creatingDescription")}
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
                    {t.rich("ownerNotice", {
                      b: (chunks) => (
                        <span className="font-medium text-foreground">
                          {chunks}
                        </span>
                      ),
                    })}
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
                {t.rich("legalConsent", {
                  terms: (chunks) => (
                    <a
                      href={LEGAL_URLS.terms}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                    >
                      {chunks}
                    </a>
                  ),
                  privacy: (chunks) => (
                    <a
                      href={LEGAL_URLS.privacy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
              {/* Native submit for the form rendered above — DynamicForm's own
                  button only calls the same handler, so this is equivalent. */}
              <Button
                type="submit"
                form="owner-setup-form"
                disabled={!hydrated}
                className="gap-2 sm:w-auto"
              >
                {t("submit")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
