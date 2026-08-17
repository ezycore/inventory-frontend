// coding-standard: maintained

import { Building2, User } from "lucide-react";

import { SampleDataToggle } from "@/components/setup/owner/sample-data-toggle";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  getIndustryOptions,
} from "@/constants/organization-options";
import type { Translator } from "@/i18n/config";
import { getRootDomain } from "@/lib/organization-utils";
import { slugify } from "@/utils/slugify";
import { DynamicFormConfig } from "@/ui/components/form/type";

/**
 * Field config for the signup form — the owner account plus its organization.
 *
 * A builder rather than a constant because every label on it is translated;
 * the caller binds `t` to the `auth.signup` namespace. Memoize the result —
 * `useDynamicForm` keys its schema and defaults off the config's identity.
 *
 * Country, timezone and currency option *labels* stay English: those three
 * arrays are shared with Settings → Organization, which reads a different
 * message namespace, and they are country names and ISO currency codes rather
 * than product copy. Business types are translated (`getIndustryOptions`) —
 * those are our words, not proper nouns.
 */
export function getOwnerSetupFormConfig(t: Translator): DynamicFormConfig {
  return {
    sections: [
      {
        title: t("accountSectionTitle"),
        description: t("accountSectionDescription"),
        icon: <User className="h-4 w-4" />,
        collapsible: false,
        fields: [
          {
            name: "firstName",
            type: "input",
            label: t("firstNameLabel"),
            columnSpan: 6,
            placeholder: t("firstNamePlaceholder"),
            required: true,
            validation: { minLength: 2, maxLength: 100 },
          },
          {
            name: "lastName",
            type: "input",
            label: t("lastNameLabel"),
            columnSpan: 6,
            placeholder: t("lastNamePlaceholder"),
            validation: { maxLength: 100 },
          },
          {
            name: "email",
            type: "input",
            label: t("emailLabel"),
            columnSpan: 6,
            placeholder: t("emailPlaceholder"),
            required: true,
            validation: { email: true },
          },
          {
            name: "phone",
            type: "input",
            label: t("phoneLabel"),
            columnSpan: 6,
            placeholder: t("phonePlaceholder"),
            validation: { maxLength: 20 },
          },
          {
            name: "password",
            type: "password",
            label: t("passwordLabel"),
            columnSpan: 6,
            placeholder: t("passwordPlaceholder"),
            required: true,
            // Stated as persistent helper text rather than only a placeholder,
            // which disappears the moment they start typing.
            helperText: t("passwordHelper"),
            validation: { minLength: 8 },
          },
          {
            name: "confirmPassword",
            type: "password",
            label: t("confirmPasswordLabel"),
            columnSpan: 6,
            placeholder: t("confirmPasswordPlaceholder"),
            required: true,
            validation: { minLength: 8 },
          },
        ],
      },
      {
        title: t("organizationSectionTitle"),
        description: t("organizationSectionDescription"),
        icon: <Building2 className="h-4 w-4" />,
        collapsible: false,
        fields: [
          {
            name: "organizationName",
            type: "input",
            label: t("organizationNameLabel"),
            columnSpan: 6,
            placeholder: t("organizationNamePlaceholder"),
            required: true,
            // 100 to match the backend: signup names the workspace's first
            // location with this exact string, and `Location.name` caps at 100.
            // A longer name failed validation *inside* the signup transaction —
            // the merchant lost the whole form to an error about a field that
            // isn't on it.
            validation: { minLength: 2, maxLength: 100 },
          },
          {
            name: "organizationSlug",
            type: "input",
            // NOT "workspace address" — that reads as a street address, which
            // is the one thing it isn't. This field is a URL.
            label: t("organizationSlugLabel"),
            columnSpan: 6,
            placeholder: t("organizationSlugPlaceholder"),
            required: true,
            // Rendered inside the field so the address is visible, not just
            // described. Omitted when NEXT_PUBLIC_ROOT_DOMAIN is unset (local dev
            // / single-host), where there is no subdomain to show.
            suffix: () => {
              const root = getRootDomain();
              return root ? `.${root}` : undefined;
            },
            // A shop name written in Bangla (or any non-Latin script) slugifies
            // to nothing, so the page leaves this field empty for the merchant
            // to fill in. Saying why, at the field, is the whole fix: without
            // it they meet a required-field error on something they never
            // touched and read it as "this software won't take my shop's name".
            // We deliberately do NOT invent a slug for them — it is the address
            // they and their customers have to remember.
            helperText: (values) => {
              const name =
                typeof values.organizationName === "string"
                  ? values.organizationName.trim()
                  : "";
              return name && !slugify(name)
                ? t("organizationSlugManualHelper")
                : t("organizationSlugHelper");
            },
            validation: {
              minLength: 2,
              maxLength: 100,
              pattern: /^[a-z0-9-]+$/,
              patternMessage: t("organizationSlugPatternMessage"),
            },
            tooltip: t("organizationSlugTooltip"),
          },
          {
            name: "industry",
            type: "select",
            label: t("industryLabel"),
            columnSpan: 6,
            placeholder: t("industryPlaceholder"),
            required: true,
            options: getIndustryOptions(t),
          },
          {
            name: "country",
            type: "select",
            label: t("countryLabel"),
            columnSpan: 6,
            placeholder: t("countryPlaceholder"),
            required: true,
            options: COUNTRY_OPTIONS,
          },
          {
            name: "timezone",
            type: "select",
            label: t("timezoneLabel"),
            columnSpan: 6,
            placeholder: t("timezonePlaceholder"),
            required: true,
            options: TIMEZONE_OPTIONS,
          },
          {
            name: "currency",
            type: "select",
            label: t("currencyLabel"),
            columnSpan: 6,
            placeholder: t("currencyPlaceholder"),
            required: true,
            options: CURRENCY_OPTIONS,
          },
          {
            // Required, and collected here rather than in onboarding: this is
            // the address of the location signup creates, it prints on receipts
            // and invoices, and `Location.address` is required anyway — while
            // this was optional the backend fell back to the literal string
            // "Default Address" (docs/plan/onboarding-workspace.md §5.5).
            //
            // Labelled "business address", not "shop address": the launch
            // segment is F-commerce sellers working from home, and asking a
            // home-based seller for their *shop* address as a required field
            // creates privacy hesitation at the worst possible moment (QA-021).
            //
            // The helper says where it becomes public, because it does: the
            // storefront's `pickup.location.address` reads this same location,
            // so enabling in-store pickup publishes it to shoppers. A merchant
            // deciding what to type here needs that before they type it.
            name: "address",
            type: "textarea",
            label: t("addressLabel"),
            columnSpan: 12,
            placeholder: t("addressPlaceholder"),
            helperText: () => t("addressHelper"),
            required: true,
            validation: { minLength: 5, maxLength: 300 },
          },
          {
            name: "loadSampleData",
            type: "custom",
            // Render as a rich toggle card while keeping a boolean in the schema.
            zodType: "boolean",
            // On by default. An empty workspace is the most common way a trial
            // dies in its first five minutes — there is nothing to look at, so
            // there is nothing to come back for. The switch stays, so anyone
            // who wants to start clean still can.
            defaultValue: true,
            label: "",
            columnSpan: 12,
            customComponent: SampleDataToggle,
          },
        ],
      },
    ],
  };
}
