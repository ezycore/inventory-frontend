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
      label: t("form.lastName"),
      placeholder: t("form.lastNamePlaceholder"),
      required: true,
      columnSpan: 6,
      validation: { minLength: 1, maxLength: 50 },
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
      name: "locationIds",
      type: "select",
      label: t("form.locations"),
      optionsApi: selectOptions("activeLocations"),
      mode: "multiple",
      columnSpan: 12,
      required: false,
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
