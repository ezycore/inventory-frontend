// coding-standard: maintained
import { DynamicFormConfig } from "@/ui/components/form/type";
import { ApiResponse, Location, PaginatedResponse } from "@/types";
import { sanitize } from "@/utils";

// Form configuration for user management
export const userFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "firstName",
      type: "input",
      label: "First Name",
      placeholder: "Enter first name",
      required: true,
      columnSpan: 6,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "lastName",
      type: "input",
      label: "Last Name",
      placeholder: "Enter last name",
      required: true,
      columnSpan: 6,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
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
      label: "Phone Number",
      placeholder: "Enter phone number (optional)",
      columnSpan: 12,
    },
    {
      name: "role",
      type: "select",
      label: "Role",
      required: true,
      columnSpan: 12,
      defaultValue: "",
      options: [],
    },
    {
      name: "locationIds",
      type: "select",
      label: "Assign Locations",
      optionsApi: "/locations/active",
      mode: "multiple",
      columnSpan: 12,
      required: false,
      description: "Select locations for roles without all-location access.",
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
};

export const userSearchConfig = {
  globalSearch: true,
  placeholder: "Search users by name, role...",
};

export const userFormDefaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  locationIds: [] as string[],
};
