// coding-standard: maintained

import { Building2, User } from "lucide-react";

import { SampleDataToggle } from "@/components/setup/owner/sample-data-toggle";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  INDUSTRY_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/constants/organization-options";
import { getRootDomain } from "@/lib/organization-utils";
import { DynamicFormConfig } from "@/ui/components/form/type";

/** Field config for the signup form — the owner account plus its organization. */
export const ownerSetupFormConfig: DynamicFormConfig = {
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
            "Where you and your team will sign in — and the address your online store gets on day one. Lowercase letters, numbers and hyphens. Prefer your own domain? You can connect one later in Settings → Domains.",
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
