"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { MigrationRunView } from "@/components/products/migrate/migration-run-view";
import { WooConnectForm } from "@/components/products/migrate/woo-connect-form";
import { useUrlParam } from "@/hooks/use-url-param";
import { isMigrationActive, useMigration, useMigrations } from "@/services/api";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";

interface MoveTabProps {
  /** The WooCommerce connector writes products AND customers, so it needs both import permissions. */
  canConnect: boolean;
  /** Whether the Import tab offers Products, where a Woo export file goes. */
  canImportProducts: boolean;
  onGoToImport: () => void;
}

/**
 * Moving a shop in (backend `docs/plan/data-migration.md`). The WooCommerce
 * run being watched is in the URL (`?run=`), so a reload, or coming back an
 * hour later, lands on the same migration; with none named, a migration still
 * going is resumed.
 */
export function MoveTab({ canConnect, canImportProducts, onGoToImport }: MoveTabProps) {
  const t = useTranslations("importExport.move");
  const tWoo = useTranslations("products.products.migrate");
  const [runParam, setRunParam] = useUrlParam<string>("run", "any", "");
  const runs = useMigrations();
  const resumable = (runs.data ?? []).find(
    (run) => run.source === "woocommerce_rest" && (isMigrationActive(run) || run.status === "previewed"),
  );
  const runId = canConnect ? runParam || resumable?._id : undefined;
  const run = useMigration(runId);

  return (
    <div className="space-y-6">
      {canConnect && (
        <section className="max-w-3xl space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{tWoo("title")}</h2>
            <p className="text-sm text-muted-foreground">{tWoo("subtitle")}</p>
          </div>
          {runs.isLoading || (runId && run.isLoading) ? (
            <Skeleton className="h-64 w-full" />
          ) : run.data ? (
            <MigrationRunView run={run.data} onStartAnother={() => setRunParam("")} />
          ) : (
            <WooConnectForm onStarted={(id) => setRunParam(id)} />
          )}
        </section>
      )}

      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        {canImportProducts && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("csvTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("csvDescription")}</p>
              <Button variant="outline" onClick={onGoToImport}>
                {t("csvButton")}
              </Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("offerTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("offerDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
