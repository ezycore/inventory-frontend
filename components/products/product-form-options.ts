// coding-standard: maintained
// Product Form Select Options
import type { Translator } from "@/i18n/config";

/** Only `taxTypeOptions` is live (used by form-config.tsx) — the rest below are
 * unused (dead code, kept English), listed for completeness of the intended
 * form-options library. */
export const getTaxTypeOptions = (t: Translator) => [
  { value: "inclusive", label: t("taxType.inclusive") },
  { value: "exclusive", label: t("taxType.exclusive") },
  { value: "exempt", label: t("taxType.exempt") },
];

export const sellingTypeOptions = [
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'both', label: 'Both' },
]

export const subCategoryOptions = [
  { value: 'sub1', label: 'Sub Category 1' },
  { value: 'sub2', label: 'Sub Category 2' },
]


export const barcodeSymbologyOptions = [
  { value: 'CODE128', label: 'CODE128' },
  { value: 'CODE39', label: 'CODE39' },
  { value: 'EAN13', label: 'EAN13' },
  { value: 'UPC', label: 'UPC' },
]

export const warrantyOptions = [
  { value: 'none', label: 'No Warranty' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
]
