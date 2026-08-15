// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { ApiResponse, Location, PaginatedResponse } from "@/types";
import { FilterConfig } from "@/types/DataTable";
import { sanitize } from "@/utils";
import type { Translator } from "@/i18n/config";

// Form configuration for user management
export const getUserFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "firstName",
      type: "input",
      label: t("form.firstName"),
      placeholder: t("form.firstNamePlaceholder"),
      required: true,
      columnSpan: 6,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "lastName",
      type: "input",
      // Optional — the model does not require it and neither does signup, so a
      // staff invite must not be the one place that demands one.
      label: t("form.lastName"),
      placeholder: t("form.lastNamePlaceholder"),
      columnSpan: 6,
      validation: { maxLength: 100 },
    },
    {
      name: "email",
      type: "input",
      label: t("form.email"),
      placeholder: t("form.emailPlaceholder"),
      required: true,
      columnSpan: 12,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        email: true,
      },
    },
    {
      name: "phone",
      type: "input",
      label: t("form.phone"),
      placeholder: t("form.phonePlaceholder"),
      columnSpan: 12,
    },
    {
      name: "role",
      type: "select",
      label: t("form.role"),
      required: true,
      columnSpan: 12,
      defaultValue: "",
      options: [],
    },
    {
      // Required, because a role without `locations.all` scopes every query by
      // the active location: a user saved with none can sign in and read
      // nothing, while the sidebar still renders normally. The page injects
      // `dependsOn` (roles carrying `locations.all` don't need one) and a
      // first-location default — see `roleAwareFormConfig` in users/page.tsx.
      name: "locationIds",
      type: "select",
      label: t("form.locations"),
      optionsApi: selectOptions("activeLocations"),
      mode: "multiple",
      columnSpan: 12,
      required: true,
      description: t("form.locationsDescription"),
      itemsCreateCallback: (response: ApiResponse<PaginatedResponse<Location>>) => {
        const items = sanitize(response?.data?.items, 'array');
        return items.map((item) => ({
            value: item._id,
            label: `${item.name} (${item.locationType})`,
          }),
        );
      },
    },
  ],
});

/** Filter config for the users list — a server-side `search` field, first. */
export const getUserFilterConfig = (t: Translator): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("searchPlaceholder"),
      type: "text",
      placeholder: t("searchPlaceholder"),
    },
  ],
});

export const userFormDefaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  locationIds: [] as string[],
};
