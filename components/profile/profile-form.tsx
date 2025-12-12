import useDynamicForm from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
import { createProfileFormConfig } from "./profile-form-config";
import { useEffect } from "react";


export default function ProfileForm({user,onFieldChange,submitLabel,onSubmit}) {
  const { form, config } = useDynamicForm(createProfileFormConfig());

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

  return (
    <DynamicForm
                  id="profile-form"
                  className="space-y-6"
                  config={config}
                  form={form}
                  onFieldChange={onFieldChange}
                  // Form actions props
                  cancelLabel="Cancel"
                  submitLabel={submitLabel}
                  onSubmit={onSubmit}
                  // onCancel={() => onCancel ? onCancel() : router.back()}

                  // Content loading for edit mode
                  // contentLoading={mode === 'edit' && productLoading}

                  // Mutation hook
                  // mutationHook={mode === 'create' ? createProduct : updateProduct}
                  onSuccess={onSubmit}
                  // onFailed={handleActionError}
                />
  );
}