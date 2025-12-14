import useDynamicForm from "@/hooks/use-dynamic-form";
import DynamicForm from "@/ui/components/form";
import { DynamicFormConfig } from "@/ui/components/form/type";

const ownerFormConfig: DynamicFormConfig = {
  fields: [
        {
          name: "firstName",
          type: "input",
          label: "First Name",
          columnSpan: 6,
          placeholder: "Enter first name",
          required: true,
        },
        {
          name: "lastName",
          type: "input",
          label: "Last Name",
          columnSpan: 6,
          placeholder: "Enter last name",
          required: true,
        },
        {
          name: "email",
          type: "input",
          label: "Email",
          columnSpan: 6,
          placeholder: "Enter email",
          required: true,
        },
        {
          name: "phone",
          type: "input",
          label: "Phone Number",
          columnSpan: 6,
          placeholder: "Enter phone number",
        },
        {
          name: "password",
          type: "password",
          label: "Current Password",
          columnSpan: 6,
          placeholder: "Enter password",
          required: true,
        },
        {
          name: "confirmPassword",
          type: "password",
          label: "Confirm Password",
          columnSpan: 6,
          placeholder: "Re-enter password",
          required: true,
        },
      ]
};


export default function OwnerForm() {
    const { form, config } = useDynamicForm(ownerFormConfig);
    return (
        <DynamicForm form={form} config={config} submitLabel="Create Owner Account" />
    );
}