import useDynamicForm from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
// import { createProfileFormConfig } from "./profile-form-config";
import { useEffect } from "react";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { User } from "lucide-react";

const profileFormConfig: DynamicFormConfig = {
  sections: [
    {
      title: "Profile Information",
      description: "Manage your personal details and contact information.",
      icon: <User className="h-5 w-5 text-blue-600" />,
      fields: [
        {
          name: "firstName",
          type: "input",
          label: "First Name",
          columnSpan: 6,
          placeholder: "Enter first name",
        },
        {
          name: "lastName",
          type: "input",
          label: "Last Name",
          columnSpan: 6,
          placeholder: "Enter last name",
        },
        {
          name: "email",
          type: "input",
          label: "Email",
          columnSpan: 6,
          placeholder: "Enter email",
        },
        {
          name: "phone",
          type: "input",
          label: "Phone Number",
          columnSpan: 6,
          placeholder: "Enter phone number",
        },
        {
          name: "currentPassword",
          type: "password",
          label: "Current Password",
          columnSpan: 6,
          placeholder: "Enter current password",
        },
      ],
    },
  ],
};

export default function ProfileForm({
  user,
  submitLabel = "Save Changes"
,
}) {
  const { form, config } = useDynamicForm(profileFormConfig);

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        password: "",
        images: [],
      });
    }
  }, [user?.id, form]);

    const handleFieldChange = (fieldName: string, value: any) => {
    console.log(`Field changed: ${fieldName} =`, value);
  };
  const handleProfileSubmit = (e: React.FormEvent) => {
    console.log("Profile form submitted:", form.getValues());
    e.preventDefault();
  };

  return (
    <DynamicForm
      id="profile-form"
      className="space-y-6"
      config={config}
      form={form}
      onFieldChange={handleFieldChange}
      // Form actions props
      cancelLabel="Cancel"
      submitLabel={submitLabel}
      onSubmit={handleProfileSubmit}
      // onCancel={() => onCancel ? onCancel() : router.back()}

      // Content loading for edit mode
      // contentLoading={mode === 'edit' && productLoading}

      // Mutation hook
      // mutationHook={mode === 'create' ? createProduct : updateProduct}
      onSuccess={handleProfileSubmit}
      // onFailed={handleActionError}
    />
  );
}
