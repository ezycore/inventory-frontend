"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { OrganizationTab, TransferOwnershipTab } from "@/components/profile";
import { FinancialYearCard } from "@/components/settings/financial-year-card";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";

export default function OrganizationSettingsPage() {
  const t = useTranslations("settings.organization");
  const user = useAuthStore((state) => state.user);
  const isOwner = !!user && user.organization?.ownerId === user.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      <Card>
        <CardContent>
          <OrganizationTab />
        </CardContent>
      </Card>

      <FinancialYearCard />

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>{t("transferTitle")}</CardTitle>
            <CardDescription>
              {t("transferDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferOwnershipTab />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
