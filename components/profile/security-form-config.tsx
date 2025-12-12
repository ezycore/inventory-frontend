import React from 'react'
import { Plus, User, Wand2 } from 'lucide-react'
import type { DynamicFormConfig } from '@/ui/components/form/type'

export const createSecurityFormConfig = (
  onNameChange?: (name: string) => void,
  onGenerateBarcode?: () => void
): DynamicFormConfig => {
   return {
      generateSchema: true,
      layout: {
        maxColumns: 12,
        gap: 4,
        sectionSpacing: 6,
      },
      sections: [
        {
          title: "Personal Information",
          description: "Manage your personal details and contact information.",
          icon: <User className="h-5 w-5 text-blue-600" />,
          collapsible: true,
          defaultOpen: true,
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
            }
          ],
        }
      ],
    };
}