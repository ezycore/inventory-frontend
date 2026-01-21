"use client";

import { brandFormConfig } from "@/components/brands/constants";
import { categoryFormConfig } from "@/components/categories/form-config";
import FieldSettingsManager from "@/components/products/field-settings-manager";
import { productFormConfig } from "@/components/products/form-config";
import { organizationApi } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { useFieldSettingsStore } from "@/stores/use-field-settings-store";
import PageHeader from "@/ui/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { Loader2, Package, Star, Tag } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { toast } from "sonner";

const modules = [
  {
    key: "product",
    label: "Products",
    icon: Package,
    formConfig: productFormConfig,
  },
  {
    key: "brand",
    label: "Brands",
    icon: Star,
    formConfig: brandFormConfig,
  },
  {
    key: "category",
    label: "Categories",
    icon: Tag,
    formConfig: categoryFormConfig,
  },
];

const validTabs = modules.map((m) => m.key);

function FieldSettingsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = validTabs.includes(tabParam || "") ? tabParam! : "product";

  const user = useAuthStore((state) => state.user);
  const canManageSettings =
    user?.permissions?.includes("organization.edit") ?? false;

  const { updateModuleExcludedFields, getExcludedFieldsForModule } =
    useFieldSettingsStore();
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  // Redirect if user doesn't have permission
  React.useEffect(() => {
    if (user && !canManageSettings) {
      toast.error("You don't have permission to access this page");
      router.push("/");
    }
  }, [user, canManageSettings, router]);

  // Don't render if no permission
  if (!canManageSettings) {
    return null;
  }

  const handleSave = async (module: string, fields: string[]) => {
    try {
      await organizationApi.updateFormSettings({ [module]: fields });
      updateModuleExcludedFields(module, fields);

      toast.success("Field settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save field settings");
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Field Settings"
        subTitle="Customize which fields appear in forms for your organization"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {modules.map((module) => (
            <TabsTrigger
              key={module.key}
              value={module.key}
              className="flex items-center gap-2"
            >
              <module.icon className="h-4 w-4" />
              {module.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {modules.map((module) => (
          <TabsContent key={module.key} value={module.key}>
            <FieldSettingsManager
              formConfig={module.formConfig}
              module={module.key}
              excludedFields={getExcludedFieldsForModule(module.key)}
              onSave={(fields) => handleSave(module.key, fields)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function FormSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FieldSettingsForm />
    </Suspense>
  );
}
