"use client";
import { useUpdatePreferences } from "@/hooks";
import useDynamicForm from "@/hooks/use-dynamic-form";
import { useAuthStore } from "@/stores";
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { useState } from "react";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "INR", label: "INR (₹)" },
];

const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "GMT", label: "GMT" },
  { value: "EST", label: "EST" },
  { value: "PST", label: "PST" },
  { value: "CST", label: "CST" },
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const preferenceFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "theme",
      type: "select",
      label: "Theme",
      columnSpan: 6,
      options: themeOptions,
    },
    {
      name: "currency",
      type: "select",
      label: "Currency",
      columnSpan: 6,
      options: currencyOptions,
    },
    {
      name: "timezone",
      type: "select",
      label: "Timezone",
      columnSpan: 6,
      options: timezoneOptions,
    },
    {
      name: "language",
      type: "select",
      label: "Language",
      columnSpan: 6,
      options: languageOptions,
    },
  ],
};
export default function PreferenceForm({ user }) {
  const { form, config } = useDynamicForm(preferenceFormConfig);
  const updatePreferences = useUpdatePreferences();

  const [preferencesForm, setPreferencesForm] = useState<{
    theme: "light" | "dark" | "system";
    currency: string;
    timezone: string;
    language: string;
  } | null>(null);

  const currentPreferencesForm = preferencesForm || {
    theme: user?.preferences?.theme || "system",
    currency: user?.preferences?.currency || "USD",
    timezone: user?.preferences?.timezone || "UTC",
    language: user?.preferences?.language || "en",
  };

  const onFieldChange = (name: string, value: any) => {
    form.setValue(name, value);
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    console.log("Preferences form submitted:", form.getValues(),currentPreferencesForm);
    updatePreferences.mutate({ preferences: currentPreferencesForm });
  };

  const submitLabel = updatePreferences.isPending
                        ? "Saving..."
                        : "Save Preferences";

  return (
    <>
      <DynamicForm
        id="profile-form"
        className="space-y-6"
        config={config}
        form={form}
        onFieldChange={onFieldChange}
        // Form actions props
        cancelLabel="Cancel"
        submitLabel={submitLabel}
        onSubmit={handlePreferencesSubmit}
        // onCancel={() => onCancel ? onCancel() : router.back()}

        // Content loading for edit mode
        // contentLoading={mode === 'edit' && productLoading}

        // Mutation hook
        // mutationHook={mode === 'create' ? createProduct : updateProduct}
        onSuccess={handlePreferencesSubmit}
        // onFailed={handleActionError}
      />
    </>
  );
}
