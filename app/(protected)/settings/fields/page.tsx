"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { brandFormConfig } from "@/components/brands/form-config";
import { categoryFormConfig } from "@/components/categories/form-config";
import { tagFormConfig } from "@/components/tags/form-config";
import FieldSettingsManager from "@/components/products/field-settings-manager";
import { productFormConfig } from "@/components/products/form-config";
import { useAuthStore } from "@/services/stores";
import type { Translator } from "@/i18n/config";
import PageHeader from "@/ui/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { Loader2, Package, Star, Tag, Tags } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { toast } from "sonner";
import { useUpdateFormSettings } from "@/services/api";

const getModules = (t: Translator) => [
  {
    key: "product",
    label: t("tabs.product"),
    icon: Package,
    formConfig: productFormConfig,
  },
  {
    key: "brand",
    label: t("tabs.brand"),
    icon: Star,
    formConfig: brandFormConfig,
  },
  {
    key: "category",
    label: t("tabs.category"),
    icon: Tag,
    formConfig: categoryFormConfig,
  },
  {
    key: "tag",
    label: t("tabs.tag"),
    icon: Tags,
    formConfig: tagFormConfig,
  },
];

const validTabs = ["product", "brand", "category", "tag"];

function FieldSettingsForm() {
  const t = useTranslations("settings.fields");
  const tShell = useTranslations("settings.shell");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = validTabs.includes(tabParam || "") ? tabParam! : "product";
  const { mutateAsync: updateFormSettings } = useUpdateFormSettings();
  const modules = getModules(t);

  const user = useAuthStore((state) => state.user);
  const canManageSettings =
    user?.permissions?.includes("organization.edit") ?? false;

  const [activeTab, setActiveTab] = React.useState(defaultTab);

  // Redirect if user doesn't have permission
  React.useEffect(() => {
    if (user && !canManageSettings) {
      toast.error(tShell("noPermission"));
      router.push("/");
    }
  }, [user, canManageSettings, router, tShell]);

  // Don't render if no permission
  if (!canManageSettings) {
    return null;
  }

  const handleSave = async (module: string, fields: string[]) => {
    await updateFormSettings({ [module]: fields });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Four nowrap triggers exceed a phone viewport; scroll the strip instead of
            clipping the last tab out of reach. */}
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max">
            {modules.map((module) => (
              <TabsTrigger
                key={module.key}
                value={module.key}
                className="flex items-center gap-2 cursor-pointer data-[state=active]:border-primary"
              >
                <module.icon className="h-4 w-4" />
                {module.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {modules.map((module) => (
          <TabsContent key={module.key} value={module.key}>
            <FieldSettingsManager
              formConfig={module.formConfig}
              module={module.key}
              excludedFields={user?.organization?.settings?.excludedFields?.[module.key] || []}
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
