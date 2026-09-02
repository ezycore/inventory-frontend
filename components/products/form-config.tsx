"use client"
// coding-standard: maintained

import { selectOptions } from "@/services/api/select-options";
import type { DynamicFormConfig } from '@/ui/components/form/type'
import { Controller } from 'react-hook-form'
import {
  Info,
  Barcode,
  BadgeDollarSign,
  Boxes,
  Ruler,
  Layers,
  ImageIcon,
  Percent,
  CalendarClock,
} from 'lucide-react'
import { ProductStatus } from '@/types'
import { getTaxTypeOptions } from './product-form-options'
import VariantsField from './variants-field'
import ComboComponentsField from './combo-components-field'
import PriceFieldWithUnit from './price-field-with-unit'
import { Switch } from '@/ui/components/switch'
import type { Translator } from '@/i18n/config'
import { RECOMMENDED } from "@/lib/image-ratio";

/**
 * Category options for the product form.
 *
 * Exported so `use-category-vat-prefill` can read the same query — the URL *is*
 * the TanStack cache key, so any drift between the two would double the request
 * and, worse, let the prefill read an option list without `defaultTaxId`.
 *
 * **`parentId=null` is load-bearing.** Sub-categories live in the same
 * collection, and `product.categoryId` must always hold a TOP-LEVEL category —
 * offering a child here would produce a product the backend rejects
 * (`PRODUCT_SUBCATEGORY_MISMATCH`) or, worse, one filed at the wrong level.
 */
export const CATEGORY_OPTIONS_API = selectOptions("categories", {
  parentId: "null",
  fields: "_id,name,isDefault,defaultTaxId",
});

/**
 * The projection both spellings of the sub-category list must request. One
 * const because the two MUST produce byte-identical URLs — the URL is the cache
 * key, so a drift here would have the VAT prefill miss the very list the select
 * beside it just fetched.
 */
const SUBCATEGORY_FIELDS = "_id,name,defaultTaxId";

/**
 * Sub-category options — the children of whichever category is selected.
 *
 * `{{value}}` is substituted by the form renderer from this field's primary
 * `dependsOn` (the category select), so the list refetches per parent. Until a
 * category is chosen the template cannot resolve and no request is made.
 */
const SUBCATEGORY_OPTIONS_API = selectOptions("categories", {
  parentId: "{{value}}",
  fields: SUBCATEGORY_FIELDS,
});

/**
 * The same URL with the parent already substituted — what the renderer's
 * `resolveApiTemplate` produces, and therefore the cache key the select's
 * options are stored under. `useCategoryVatPrefill` reads that entry to resolve
 * a chosen child's own rate without issuing a second request.
 */
export const subcategoryOptionsApi = (parentId: string): string =>
  selectOptions("categories", { parentId, fields: SUBCATEGORY_FIELDS });

const TAG_OPTIONS_API = selectOptions("tags", {
  status: "active",
  fields: "_id,name,color",
});

/**
 * The product form's rate picker. Distinct from the categories form's constant: this one also asks
 * for `isDefault`, which the `defaultFlag` prefill reads. Collapsing the two would silently disable
 * the default-rate prefill.
 */
const PRODUCT_TAX_OPTIONS_API = selectOptions("taxes", {
  status: "active",
  fields: "_id,name,rate,vatCategory,isDefault",
});

// Section header toggle that binds to `addToInventory`. Rendered via the
// FormSection.headerAction slot, so it sits on the right of the header.
function TrackStockToggle({ control, label }: { control: any; label: string }) {
  return (
    <Controller
      name="addToInventory"
      control={control}
      render={({ field }) => (
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <Switch
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
        </label>
      )}
    />
  )
}

const sectionIcon = (Icon: typeof Info) => (
  <Icon className="h-4 w-4 text-orange-600" />
)

/**
 * Single source for the product form structure. `t` is optional: the
 * module-scope quick-add registries and the settings/fields field-visibility
 * tool can't call `useTranslations`, so they get the English fallback
 * (`productFormConfig` below); the real Products page passes `t` via
 * `getProductFormConfig(t)`.
 */
function buildProductFormConfig(t?: Translator): DynamicFormConfig {
  const tr = (key: string, fallback: string) => (t ? t(key) : fallback)
  const productTypeOptions = [
    {
      value: 'single',
      label: tr('form.typeSingle', "Simple product"),
      description: tr('form.typeSingleDescription', "One product, one price"),
    },
    {
      value: 'variable',
      label: tr('form.typeVariable', "Variable product"),
      description: tr('form.typeVariableDescription', "Multiple variants (size, color...)"),
    },
    {
      value: 'combo',
      label: tr('form.typeCombo', "Combo / bundle"),
      description: tr('form.typeComboDescription', "Several products sold as one priced unit"),
    },
  ]
  const taxTypeOptions = t
    ? getTaxTypeOptions(t)
    : [
        { value: "inclusive", label: "Inclusive" },
        { value: "exclusive", label: "Exclusive" },
        { value: "exempt", label: "Exempt" },
      ]

  return {
    generateSchema: true,
    layout: {
      maxColumns: 12,
      gap: 4,
      sectionSpacing: 6
    },
    sections: [
      // 1. BASICS ---------------------------------------------------------------
      {
        title: tr('form.sections.basicsTitle', "Basic Information"),
        description: tr('form.sections.basicsDescription', "The essentials customers will see"),
        icon: sectionIcon(Info),
        collapsible: false,
        fields: [
          {
            name: "name",
            type: "input",
            label: tr('form.name', "Product name"),
            required: true,
            columnSpan: 6,
            placeholder: tr('form.namePlaceholder', "Enter product name"),
            validation: { minLength: 1, maxLength: 255 },
          },
          {
            name: 'status',
            type: 'select',
            label: tr('form.status', "Status"),
            required: true,
            columnSpan: 6,
            options: [
              { value: ProductStatus.ACTIVE, label: tr('form.statusActive', "Active — available for sale") },
              { value: ProductStatus.INACTIVE, label: tr('form.statusInactive', "Inactive — hidden from sale") },
              { value: ProductStatus.ARCHIVED, label: tr('form.statusArchived', "Archived — kept for records") },
            ],
            defaultValue: ProductStatus.ACTIVE,
          },
          {
            name: "productType",
            type: "radio-group",
            label: tr('form.productType', "Product type"),
            required: true,
            columnSpan: 12,
            defaultValue: "single",
            optionLayout: "cards",
            lockedDisplay: (values) => {
              const selectedType = productTypeOptions.find(
                (option) => option.value === values.productType,
              )

              return (
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    {selectedType?.label || values.productType || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedType?.description}
                    {selectedType?.description ? " " : ""}
                    {tr(
                      'form.productTypeLockedHint',
                      "Product type is set when the product is created and cannot be changed.",
                    )}
                  </p>
                </div>
              )
            },
            // The 'combo' option is stripped in the products page when the org's
            // `combo` feature is off (see comboGatedFormConfig).
            options: productTypeOptions,
          },
          {
            name: "categoryId",
            type: "select",
            label: tr('form.category', "Category"),
            required: true,
            columnSpan: 6,
            placeholder: tr('form.categoryPlaceholder', "Choose category"),
            optionsApi: CATEGORY_OPTIONS_API,
            defaultFlag: "isDefault",
            // A sub-category only exists under one category, so changing the
            // category invalidates whatever was chosen. Without this the form
            // posts a stale pair and only the server notices
            // (PRODUCT_SUBCATEGORY_MISMATCH).
            clearFieldsOnChange: ["subcategoryId"],
            creatable: true,
            quickAddModule: "category",
          },
          {
            name: "subcategoryId",
            type: "select",
            label: tr('form.subcategory', "Sub-category"),
            columnSpan: 6,
            placeholder: tr('form.subcategoryPlaceholder', "Choose sub-category"),
            optionsApi: SUBCATEGORY_OPTIONS_API,
            // Disabled until a category is picked: the options ARE that
            // category's children, and the pair is rejected server-side if the
            // two disagree.
            dependsOn: {
              field: "categoryId",
              condition: "truthy",
              action: "enable",
            },
            creatable: true,
            quickAddModule: "category",
          },
          {
            name: "brandId",
            type: "select",
            label: tr('form.brand', "Brand"),
            columnSpan: 6,
            optionsApi: selectOptions("brands", { fields: "_id,name,isDefault" }),
            defaultFlag: "isDefault",
            placeholder: tr('form.brandPlaceholder', "Select brand"),
            creatable: true,
            quickAddModule: "brand",
          },
          // {
          //   name: "sellingType",
          //   type: "select",
          //   label: "Selling type",
          //   columnSpan: 4,
          //   options: sellingTypeOptions,
          //   placeholder: "Select selling type",
          //   defaultValue: "retail",
          // },
          {
            name: "tagIds",
            type: "select",
            mode: "multiple",
            label: tr('form.tags', "Tags"),
            columnSpan: 6,
            placeholder: tr('form.tagsPlaceholder', "Add tags"),
            optionsApi: TAG_OPTIONS_API,
            creatable: true,
            quickAddModule: "tag",
          },
          {
            name: "description",
            type: "textarea",
            label: tr('form.description', "Description"),
            // required: true,
            columnSpan: 12,
            placeholder: tr('form.descriptionPlaceholder', "Enter product description"),
            rows: 4,
          },
        ],
      },

      // 2. BARCODE --------------------------------------------------------------
      // Feature-gated by `barcodeSystem`: useFilteredFormConfig excludes these
      // fields when the feature is off, and the empty section is dropped entirely.
      // The barcode TYPE is product-level and shared by every variant; only the
      // barcode VALUE is single-only (variable products carry a value per variant,
      // captured in the Variants table).
      {
        title: tr('form.sections.barcodeTitle', "Barcode"),
        description: tr('form.sections.barcodeDescription', "Scannable code and how it is rendered"),
        icon: sectionIcon(Barcode),
        collapsible: false,
        fields: [
          {
            name: "barcode",
            type: "input",
            label: tr('form.barcode', "Barcode"),
            columnSpan: 6,
            placeholder: tr('form.barcodePlaceholder', "Scan or type barcode"),
            tooltip: tr('form.barcodeTooltip', "The barcode printed on the product packaging. Scan it with a reader or type it in. Leave empty to auto-generate a barcode you can print labels for."),
            validation: { maxLength: 64 },
            // Single + combo carry a product-level barcode; variable carries it per variant.
            dependsOn: { field: "productType", value: ["single", "combo"], condition: "in", action: "show" },
          },
          {
            name: "barcodeSymbology",
            type: "select",
            label: tr('form.barcodeSymbology', "Barcode type (all variants)"),
            columnSpan: 6,
            defaultValue: "CODE128",
            helperText: tr('form.barcodeSymbologyHint', "Shared by every variant of this product."),
            options: [
              { value: "CODE128", label: "CODE128" },
              { value: "EAN13", label: "EAN-13" },
              { value: "UPC_A", label: "UPC-A" },
              { value: "ITF14", label: "ITF-14" },
              { value: "QR", label: "QR Code" },
            ],
          },
        ],
      },

      // 3. EXPIRY & SHELF LIFE --------------------------------------------------
      // Feature-gated by `expiryTracking` (field exclusion); the empty section is
      // dropped when the feature is off.
      {
        title: tr('form.sections.expiryTitle', "Expiry & shelf life"),
        description: tr('form.sections.expiryDescription', "Batch expiry tracking and alerts"),
        icon: sectionIcon(CalendarClock),
        collapsible: false,
        // Combos track expiry on their components, never on themselves.
        dependsOn: { field: "productType", value: "combo", condition: "ne", action: "show" },
        fields: [
          {
            name: "hasExpiry",
            type: "checkbox",
            label: tr('form.hasExpiry', "Track expiry dates"),
            columnSpan: 12,
            defaultValue: true,
            // Surfaces the D7 downgrade rule before the save fails on it. The
            // server refuses to untrack a product that still holds stock
            // (PRODUCT_EXPIRY_DOWNGRADE_BLOCKED), because its batches would be
            // left backing stock nothing reads any more.
            tooltip: tr(
              'form.hasExpiryTooltip',
              "Records stock in batches with expiry dates, so it sells earliest-expiry-first and appears in expiry alerts. Turning this off later requires the product's stock to be zero at every location — batches cannot be left behind holding stock.",
            ),
          },
          {
            name: "expiryAlertDays",
            type: "number",
            precision: 0,
            label: tr('form.expiryAlertDays', "Expiry alert (days before)"),
            columnSpan: 6,
            placeholder: "0",
            defaultValue: 30,
            validation: { min: 1, max: 999999 },
            tooltip: tr('form.expiryAlertDaysTooltip', "How many days before the expiry date the product should start appearing in expiry alerts, so you have time to act on soon-to-expire stock."),
            dependsOn: { field: "hasExpiry", condition: "truthy", action: "show" },
          },
        ],
      },

      // 4. UNITS OF MEASURE -----------------------------------------------------
      // Placed before Pricing so the base unit is chosen first — the sell/cost price
      // inputs render it as a "/ unit" suffix.
      {
        title: tr('form.sections.unitsTitle', "Units of Measure"),
        description: tr('form.sections.unitsDescription', "How you count this product when purchase and sell"),
        icon: sectionIcon(Ruler),
        collapsible: false,
        // Combos hold no inventory of their own, so they carry no unit of measure.
        dependsOn: { field: "productType", value: "combo", condition: "ne", action: "show" },
        fields: [
          {
            name: "unitId",
            type: "select",
            label: tr('form.unitId', "Base unit"),
            required: true,
            columnSpan: 12,
            optionsApi: selectOptions("units", { fields: "_id,name,shortName,isDefault" }),
            defaultFlag: "isDefault",
            copyValueTo: ["saleUnit.unitId"],
            placeholder: tr('form.unitIdPlaceholder', "Select base unit"),
            tooltip: tr('form.unitIdTooltip', "The unit all stock is counted and reported in (e.g. Piece). Choose carefully — every quantity, including purchases and sales, is recorded in this unit."),
          },
          {
            name: "enableUOMConversion",
            type: "checkbox",
            label: tr('form.enableUOMConversion', "Different purchase & sales units"),
            columnSpan: 12,
            defaultValue: false,
            helperText: tr('form.enableUOMConversionHint', "e.g. buy in Boxes from supplier, sell in Pieces at the counter."),
            dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
          },
          {
            name: "purchaseUnit.unitId",
            type: "select",
            label: tr('form.purchaseUnit', "Purchase unit"),
            columnSpan: 6,
            optionsApi: selectOptions("units", { fields: "_id,name,shortName" }),
            placeholder: tr('form.purchaseUnitPlaceholder', "Select purchase unit"),
            tooltip: tr('form.purchaseUnitTooltip', "The unit you buy this product in (e.g. Box). Stock received in this unit is converted to the base unit using the conversion factor."),
            // Single-only: the enableUOMConversion checkbox is single-only, but its
            // value can linger `true` after a switch to variable (hiding a field
            // doesn't reset it) — gate on productType too so this hides (and is
            // stripped from the payload) with the checkbox.
            dependsOn: [
              { field: "enableUOMConversion", value: true, condition: "eq", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
            ],
          },
          {
            name: "purchaseUnit.conversionFactor",
            type: "number",
            // No `precision`: a conversion factor can be fractional (e.g. 0.5 kg
            // per pack), so it stays an unrestricted float.
            label: tr('form.purchaseConversionFactor', "Purchase conversion factor"),
            columnSpan: 6,
            placeholder: "e.g. 100",
            defaultValue: 1,
            validation: { min: 1 },
            tooltip: tr('form.purchaseConversionFactorTooltip', "How many base units make up one purchase unit. For example, if you buy in Boxes and 1 box holds 100 pieces, enter 100."),
            // Single-only — see purchaseUnit.unitId above.
            dependsOn: [
              { field: "enableUOMConversion", value: true, condition: "eq", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
            ],
          },
        ],
      },

      // 5. PRICING --------------------------------------------------------------
      // Single-only: variable products carry a sell price per variant (Variants table).
      {
        title: tr('form.sections.pricingTitle', "Pricing"),
        description: tr('form.sections.pricingDescription', "Set the sell price"),
        icon: sectionIcon(BadgeDollarSign),
        collapsible: false,
        // Single + combo carry a product-level price; variable prices per variant.
        dependsOn: { field: "productType", value: ["single", "combo"], condition: "in", action: "show" },
        fields: [
          {
            name: "price",
            type: "custom",
            zodType: "number",
            label: tr('form.sellPrice', "Sell price (per unit)"),
            required: true,
            columnSpan: 12,
            placeholder: "0.00",
            validation: { min: 0, max: 999999 },
            customComponent: PriceFieldWithUnit,
          },
        ],
      },

      // 6. TAX ------------------------------------------------------------------
      // No productType gate: tax is product-level (stored on the parent Product) and
      // shared by every variant. Backend reads it from the product, not the variant.
      {
        title: tr('form.sections.taxTitle', "Tax"),
        description: tr('form.sections.taxDescription', "How tax is applied — shared by all variants"),
        icon: sectionIcon(Percent),
        collapsible: false,
        fields: [
          {
            name: "salesTax.taxType",
            type: "select",
            label: tr('form.salesTaxType', "Sales tax calculation"),
            columnSpan: 6,
            options: taxTypeOptions,
            placeholder: tr('form.taxSelectPlaceholder', "Select"),
            defaultValue: "inclusive",
          },
          {
            name: "salesTax.taxId",
            type: "select",
            label: tr('form.salesTaxRate', "Sales tax rate"),
            columnSpan: 6,
            // `status=active` matters: rates are SUPERSEDED, not edited — when the
            // Finance Act changes a rate you add a new row and deactivate the old
            // one. Without this filter the retired rate stays selectable and the
            // supersede rule achieves nothing.
            optionsApi: PRODUCT_TAX_OPTIONS_API,
            defaultFlag: "isDefault",
            placeholder: tr('form.taxRatePlaceholder', "Select tax"),
          },
          {
            name: "purchaseTax.taxType",
            type: "select",
            label: tr('form.purchaseTaxType', "Purchase tax calculation"),
            columnSpan: 6,
            options: taxTypeOptions,
            placeholder: tr('form.taxSelectPlaceholder', "Select"),
            defaultValue: "inclusive",
          },
          {
            name: "purchaseTax.taxId",
            type: "select",
            label: tr('form.purchaseTaxRate', "Purchase tax rate"),
            columnSpan: 6,
            // `status=active` matters: rates are SUPERSEDED, not edited — when the
            // Finance Act changes a rate you add a new row and deactivate the old
            // one. Without this filter the retired rate stays selectable and the
            // supersede rule achieves nothing.
            optionsApi: PRODUCT_TAX_OPTIONS_API,
            defaultFlag: "isDefault",
            placeholder: tr('form.taxRatePlaceholder', "Select tax"),
          },
        ],
      },

      // 7. INVENTORY ------------------------------------------------------------
      {
        title: tr('form.sections.inventoryTitle', "Inventory"),
        description: tr('form.sections.inventoryDescription', "Stock levels and low-stock alerts"),
        icon: sectionIcon(Boxes),
        collapsible: false,
        // Inventory is only created on initial product creation. Shown for single
        // and variable products; for variable, only the toggle + shared Location
        // render here — per-variant stock lives in the Variants table. Combos hold
        // no inventory of their own, so the whole section is hidden for them.
        dependsOn: [
          { field: "_id", condition: "falsy", action: "show" },
          { field: "productType", value: "combo", condition: "ne" },
        ],
        headerAction: ({ control }: { control: any }) => (
          <TrackStockToggle control={control} label={tr('form.trackStock', "Track stock")} />
        ),
        fields: [
          {
            // The visible control is the header toggle above; this hidden field
            // exists only so `addToInventory` is part of the generated zod schema.
            // Without a declared field the schema (z.object) strips the key on
            // submit, so the backend never receives it and skips inventory creation.
            name: "addToInventory",
            type: "checkbox",
            zodType: "boolean",
            label: "",
            hidden: true,
            columnSpan: 12,
            defaultValue: false,
          },
          {
            name: "locationId",
            type: "select",
            label: tr('form.locationId', "Location"),
            hidden: true,
            columnSpan: 4,
            optionsApi: selectOptions("locations", { fields: "_id,name" }),
            placeholder: tr('form.locationIdPlaceholder', "Select location"),
            dependsOn: { field: "addToInventory", condition: "truthy", action: "show" },
          },
          {
            name: "openingStock",
            type: "number",
            precision: 0,
            zodType: "number",
            label: tr('form.openingStock', "Opening stock"),
            columnSpan: 4,
            placeholder: "0",
            defaultValue: 0,
            validation: { min: 0 },
            tooltip: tr('form.openingStockTooltip', "The quantity currently in stock at this location, entered in the product's base unit. Recorded as an opening-stock entry you can report on later; adjust it afterwards from the Inventory page."),
            // Single-only: variable products capture opening stock per variant.
            dependsOn: [
              { field: "addToInventory", condition: "truthy", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
            ],
          },
          {
            name: "costPrice",
            type: "number",
            precision: 2,
            zodType: "number",
            label: tr('form.costPrice', "Cost price (per unit)"),
            columnSpan: 4,
            placeholder: "0.00",
            defaultValue: 0,
            validation: { min: 0 },
            tooltip: tr('form.costPriceTooltip', "Unit cost of the opening stock. Used for inventory valuation and the opening-stock report."),
            dependsOn: [
              { field: "addToInventory", condition: "truthy", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
            ],
          },
          {
            name: "inventoryAlertLevel",
            type: "number",
            precision: 0,
            zodType: "number",
            label: tr('form.inventoryAlertLevel', "Low stock threshold"),
            columnSpan: 4,
            placeholder: tr('form.inventoryAlertLevelPlaceholder', "e.g. 20"),
            // Not `required`: inventory-only field, hidden in edit mode where the product
            // carries no value — a required number would fail zod with `undefined`.
            // `defaultValue: 0` keeps create submitting a value.
            validation: { min: 0 },
            defaultValue: 0,
            tooltip: tr('form.inventoryAlertLevelTooltip', "When stock falls to or below this number, the product is flagged as low stock and added to your reorder shortlist so you know when to restock."),
            dependsOn: [
              { field: "addToInventory", condition: "truthy", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
            ],
          },
          {
            name: "batchNumber",
            type: "input",
            label: tr('form.batchNumber', "Batch number"),
            columnSpan: 6,
            placeholder: tr('form.batchNumberPlaceholder', "Optional"),
            tooltip: tr('form.batchNumberTooltip', "Batch/lot number for the opening-stock batch. Only applied when expiry tracking is on for this product."),
            dependsOn: [
              { field: "addToInventory", condition: "truthy", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
              { field: "hasExpiry", condition: "truthy" },
              { field: "openingStock", condition: "gt", value: 0 },
            ],
          },
          {
            name: "expiryDate",
            type: "date",
            label: tr('form.expiryDate', "Opening expiry date"),
            columnSpan: 6,
            // Backend wants date-only (YYYY-MM-DD); emit local date to avoid a UTC off-by-one.
            outputFormat: "yyyy-MM-dd",
            tooltip: tr('form.expiryDateTooltip', "Expiry date for the opening-stock batch. Only applied when expiry tracking is on for this product."),
            dependsOn: [
              { field: "addToInventory", condition: "truthy", action: "show" },
              { field: "productType", value: "single", condition: "eq" },
              { field: "hasExpiry", condition: "truthy" },
              { field: "openingStock", condition: "gt", value: 0 },
            ],
          }
        ],
      },

      // 8. VARIANTS -------------------------------------------------------------
      {
        title: tr('form.sections.variantsTitle', "Variants"),
        description: tr('form.sections.variantsDescription', "Different sizes, colors, or strengths of this product"),
        icon: sectionIcon(Layers),
        collapsible: false,
        // Not applicable to combos (which are composed of other products).
        dependsOn: { field: "productType", value: "combo", condition: "ne", action: "show" },
        fields: [
          {
            name: "variants",
            type: "custom",
            label: "",
            columnSpan: 12,
            customComponent: VariantsField,
          },
        ],
      },

      // 8b. COMBO COMPOSITION ---------------------------------------------------
      {
        title: tr('form.sections.comboTitle', "Combo composition"),
        description: tr('form.sections.comboDescription', "The products bundled into this combo and how many of each"),
        icon: sectionIcon(Layers),
        collapsible: false,
        dependsOn: { field: "productType", value: "combo", condition: "eq", action: "show" },
        fields: [
          {
            name: "comboComponents",
            type: "custom",
            zodType: "array",
            label: "",
            columnSpan: 12,
            customComponent: ComboComponentsField,
          },
        ],
      },

      // 9. MEDIA ----------------------------------------------------------------
      {
        title: tr('form.sections.mediaTitle', "Media"),
        description: tr('form.sections.mediaDescription', "Up to 5 images. First image is the primary."),
        icon: sectionIcon(ImageIcon),
        collapsible: false,
        fields: [
          {
            name: "images",
            type: "file-upload",
            zodType: "array",
            arrayOf: "file",
            label: tr('form.images', "Product images"),
            columnSpan: 12,
            accept: "image/*",
            maxFiles: 5,
            maxSize: 5 * 1024 * 1024, // 5MB
            showPreview: true,
            dropzoneText: tr('form.imagesDropzone', "Square 1600 × 1600 px works best · PNG, JPG, WEBP up to 5MB · Max 5 images"),
            recommended: RECOMMENDED.product,
          },
        ],
      },
    ],
  }
}

// Static English config — see `buildProductFormConfig` doc comment.
export const productFormConfig: DynamicFormConfig = buildProductFormConfig()

// Translated config for the real Products page.
export const getProductFormConfig = (t: Translator): DynamicFormConfig => buildProductFormConfig(t)
