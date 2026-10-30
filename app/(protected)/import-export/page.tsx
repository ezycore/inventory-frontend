"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ExportTab } from "@/components/import-export/export-tab";
import { HistoryTab } from "@/components/import-export/history-tab";
import { ImportTab } from "@/components/import-export/import-tab";
import { MoveTab } from "@/components/import-export/move-tab";
import { useImportExportAccess } from "@/components/import-export/use-import-export-access";
import { useRequireAccess } from "@/hooks/use-require-access";
import { useUrlParam } from "@/hooks/use-url-param";
import PageHeader from "@/ui/components/header";
import { PageTabs, type PageTab } from "@/ui/components/page-tabs";

const TABS = ["import", "export", "move", "history"] as const;
type Tab = (typeof TABS)[number];

/**
 * The Import & Export center (backend `docs/plan/import-export-center.md`):
 * every way data comes in or goes out, in one place. Each tab, and each card
 * inside it, shows only what the signed-in role may do.
 */
export default function ImportExportPage() {
  const t = useTranslations("importExport.page");
  const access = useImportExportAccess();
  useRequireAccess([{ allowed: access.any, message: t("noAccess") }]);

  const tabs = useMemo(() => {
    const shown: Record<Tab, boolean> = {
      import: access.imports.length > 0,
      export: Object.values(access.exports).some(Boolean),
      move: access.move || access.imports.some((resource) => resource.key === "products"),
      history: access.history,
    };
    return TABS.filter((key) => shown[key]).map((key) => ({ key, label: t(`tabs.${key}`) })) as PageTab<Tab>[];
  }, [access, t]);

  const [tabParam, setTab] = useUrlParam<Tab>("tab", TABS, tabs[0]?.key ?? "import");
  // A tab the role cannot use, from a shared link or a stale bookmark, falls back to the first one.
  const tab = tabs.some((entry) => entry.key === tabParam) ? tabParam : (tabs[0]?.key ?? "import");

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader title={t("title")} subTitle={t("subtitle")} />
      <PageTabs<Tab> tabs={tabs} active={tab} onChange={setTab} />
      {tab === "import" && <ImportTab resources={access.imports} />}
      {tab === "export" && <ExportTab allowed={access.exports} />}
      {tab === "move" && (
        <MoveTab
          canConnect={access.move}
          canImportProducts={access.imports.some((resource) => resource.key === "products")}
          onGoToImport={() => setTab("import")}
        />
      )}
      {tab === "history" && <HistoryTab showMigrations={access.move} />}
    </div>
  );
}
