"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { navItems } from "@/constants/navItem";
import { filterNavItems } from "@/lib/nav-utils";
import { useNavLabels } from "@/hooks/use-nav-labels";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Card, CardContent } from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { ChevronRightIcon } from "lucide-react";
import { NavIcon } from "@/components/shared/nav-icon";
import Link from "next/link";
import { useMemo } from "react";

/**
 * Landing page for the Reports section. Lists the same report links the
 * sidebar shows (nav config is the single source), filtered by the user's
 * role, permissions, and enabled features.
 */
export default function ReportsPage() {
  const t = useTranslations("reports.landing");
  const { itemLabel } = useNavLabels();
  const user = useAuthStore((state) => state.user);

  const reports = useMemo(() => {
    const group = navItems.find((item) => item.url === "/reports");
    const children = group?.items ?? [];
    if (!user?.role) return children;
    return filterNavItems(
      children,
      user.role,
      user.permissions || [],
      user.organization?.features,
    );
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.url} href={report.url} className="group">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <NavIcon name={report.icon} className="h-5 w-5" />
                </div>
                <span className="flex-1 font-medium">{itemLabel(report.title)}</span>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
