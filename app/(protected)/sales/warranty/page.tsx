"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";

import { ClaimsList } from "@/components/sales/warranty/claims-list";
import { WarrantyLookup } from "@/components/sales/warranty/warranty-lookup";
import { useUrlParam } from "@/hooks/use-url-param";
import PageHeader from "@/ui/components/header";
import { PageTabs, type PageTab } from "@/ui/components/page-tabs";

const TABS = ["lookup", "claims"] as const;
type WarrantyTab = (typeof TABS)[number];

/**
 * Warranty — the counter lookup ("is this still covered?") and the claims
 * customers bring back (backend `docs/features/warranty.md`). Gated by the
 * `warranty` feature and `warranty.view` through its nav row.
 */
export default function WarrantyPage() {
  const t = useTranslations("sales.warranty");
  const [tab, setTab] = useUrlParam<WarrantyTab>("tab", TABS, "lookup");
  const tabs: readonly PageTab<WarrantyTab>[] = [
    { key: "lookup", label: t("page.tabs.lookup") },
    { key: "claims", label: t("page.tabs.claims") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("page.title")} subTitle={t("page.subtitle")} />
      <PageTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "lookup" ? <WarrantyLookup /> : <ClaimsList />}
    </div>
  );
}
