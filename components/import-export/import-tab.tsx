"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ImportCard } from "./import-card";
import { useActiveLocationName } from "./use-active-location-name";
import type { ImportResource } from "./use-import-export-access";

/** Every kind of data the signed-in user may import, one card each. */
export function ImportTab({ resources }: { resources: ImportResource[] }) {
  const t = useTranslations("importExport.import");
  const location = useActiveLocationName();

  if (resources.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("nothing")}</p>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <ImportCard key={resource.key} resource={resource} location={location} />
        ))}
      </div>
    </div>
  );
}
