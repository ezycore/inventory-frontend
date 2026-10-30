"use client";
// coding-standard: maintained

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImportDialog } from "@/components/shared/import/import-dialog";
import { invalidate } from "@/services/api/invalidation";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import type { ImportResource } from "./use-import-export-access";

/**
 * One kind of data the center can import: what it is, its template, and the
 * same `ImportDialog` (preview → map columns → commit) the list pages used.
 */
export function ImportCard({ resource, location }: { resource: ImportResource; location: string }) {
  const t = useTranslations("importExport.import");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const title = t(`resources.${resource.key}.title`);

  const downloadTemplate = () =>
    resource.config.downloadTemplate().catch(() => toast.error(t("templateFailed")));

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t(`resources.${resource.key}.description`, { location })}
        </p>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button onClick={() => setOpen(true)}>
            <Upload className="h-4 w-4" />
            {t("button")}
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            {t("template")}
          </Button>
        </div>
      </CardContent>
      <ImportDialog
        open={open}
        onOpenChange={setOpen}
        title={t("dialogTitle", { resource: title })}
        downloadTemplate={resource.config.downloadTemplate}
        preview={resource.config.preview}
        commit={resource.config.commit}
        options={resource.config.options}
        onCommitted={() => invalidate(queryClient, resource.event)}
      />
    </Card>
  );
}
