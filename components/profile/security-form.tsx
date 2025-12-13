import { useUpdatePassword } from "@/hooks";
import useDynamicForm from "@/hooks/use-dynamic-form";
import { Button } from "@/ui/components/button";
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { Lock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const securityFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "currentPassword",
      type: "password",
      label: "Current Password",
      columnSpan: 12,
      placeholder: "Enter current password",
    },
    {
      name: "newPassword",
      type: "password",
      label: "New Password",
      columnSpan: 6,
      placeholder: "Enter new password (min 6 characters)",
    },
    {
      name: "confirmPassword",
      type: "password",
      label: "Confirm Password",
      columnSpan: 6,
      placeholder: "Confirm your new password",
    },
  ],
};

export default function SecurityForm({}) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { form, config } = useDynamicForm(securityFormConfig);
  const updatePassword = useUpdatePassword();

  const onFieldChange = (name: string, value: any) => {
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    updatePassword.mutate(
      {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
      {
        onSuccess: () => {
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        },
      }
    );
  };

  const submitLabel = updatePassword.isPending
    ? "Updating..."
    : "Update Password";
  const suggestedSubmitLabel = (
    <Button
      type="submit"
      disabled={updatePassword.isPending}
      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
    >
      <Lock className="h-4 w-4" />
      {updatePassword.isPending ? "Updating..." : "Update Password"}
    </Button>
  );
  return (
    <>
      <DynamicForm
        className="w-full"
        form={form}
        config={config}
        onFieldChange={onFieldChange}
        onSubmit={handlePasswordSubmit}
        submitLabel={submitLabel}
        cancelLabel={"Clear"}
      />

      {/* <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
          Password Requirements:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Minimum 6 characters long</li>
          <li>Contains uppercase and lowercase letters (recommended)</li>
          <li>Includes at least one number (recommended)</li>
          <li>Uses special characters (recommended)</li>
        </ul>
      </div> */}
    </>
  );
}
