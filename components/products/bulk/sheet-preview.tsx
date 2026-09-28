"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import type { ProductTaxonomySheet } from "@/types/api";

type SheetChange = ProductTaxonomySheet["changes"][number];

/**
 * What applying the sheet would do, product by product: counts first, then
 * each change as "Category: Cushion → Floor Mat · + Stock Clearance − Best".
 * The server caps the list; `changed` is the true total.
 */
export function SheetPreview({ result }: { result: ProductTaxonomySheet }) {
  const t = useTranslations("products.products.bulk.sheet");
  const hidden = result.changed - result.changes.length;
  const hiddenErrors = result.invalid - result.errors.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="font-medium text-green-700 dark:text-green-400">
          {t("changed", { count: result.changed })}
        </span>
        <span className="text-muted-foreground">{t("unchanged", { count: result.unchanged })}</span>
        {result.invalid > 0 && (
          <span className="text-red-600">{t("invalid", { count: result.invalid })}</span>
        )}
      </div>

      {result.warnings.length > 0 && (
        <ul className="list-disc space-y-0.5 rounded-md border border-amber-300 bg-amber-50 py-2 pl-7 pr-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {result.errors.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-red-200 p-2 text-xs dark:border-red-500/40">
          {result.errors.map((error) => (
            <p key={error.row} className="py-0.5">
              <span className="font-medium">{t("row", { row: error.row })}</span>{" "}
              {error.errors.join("; ")}
            </p>
          ))}
          {hiddenErrors > 0 && (
            <p className="pt-1 text-muted-foreground">{t("more", { count: hiddenErrors })}</p>
          )}
        </div>
      )}

      {result.changes.length > 0 && (
        <ul className="max-h-72 divide-y overflow-y-auto rounded-md border text-xs">
          {result.changes.map((change) => (
            <li key={change.productId} className="space-y-0.5 px-3 py-2">
              <p className="font-medium text-foreground">{change.name}</p>
              <ChangeLines change={change} />
            </li>
          ))}
          {hidden > 0 && (
            <li className="px-3 py-2 text-muted-foreground">{t("more", { count: hidden })}</li>
          )}
        </ul>
      )}
    </div>
  );
}

function ChangeLines({ change }: { change: SheetChange }) {
  const t = useTranslations("products.products.bulk.sheet");
  const name = (value: string | null | undefined) => value ?? t("none");
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
      {change.category && (
        <span>
          {t("categoryChange", { from: name(change.category.from), to: name(change.category.to) })}
        </span>
      )}
      {change.subcategory && (
        <span>
          {t("subcategoryChange", {
            from: name(change.subcategory.from),
            to: name(change.subcategory.to),
          })}
        </span>
      )}
      {change.tagsAdded?.length ? (
        <span className="text-green-700 dark:text-green-400">
          + {change.tagsAdded.join(", ")}
        </span>
      ) : null}
      {change.tagsRemoved?.length ? (
        <span className="text-red-600">− {change.tagsRemoved.join(", ")}</span>
      ) : null}
    </div>
  );
}
